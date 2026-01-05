using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.Extensions.Logging;
using System.IO;

namespace AzureAISearchExplorer.Backend.Infrastructure.Services;

public class AzureResourceResolver
{
    private readonly ILogger<AzureResourceResolver> _logger;

    public AzureResourceResolver(ILogger<AzureResourceResolver> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Attempts to resolve the Azure Resource ID for a given connection profile by scanning available subscriptions.
    /// This is required for Management Plane operations (Scaling, SKU details, etc.).
    /// </summary>
    /// <param name="profile">The connection profile to resolve.</param>
    public async Task ResolveResourceIdAsync(ConnectionProfile profile)
    {
        // Reset fields
        profile.ResourceId = null;
        profile.HasManagementAccess = false;
        profile.SubscriptionId = null;
        profile.ResourceGroupName = null;

        if (profile.AuthType == "ApiKey")
        {
            // API Key only gives Data Plane access
            return;
        }

        try
        {
            var credential = await GetCredentialAsync(profile);
            var armClient = new ArmClient(credential);

            // Extract service name from endpoint
            // https://<name>.search.windows.net
            if (!Uri.TryCreate(profile.Endpoint, UriKind.Absolute, out var uri)) return;
            var serviceName = uri.Host.Split('.')[0];

            // Iterate subscriptions to find the resource
            var subscriptions = armClient.GetSubscriptions();
            
            await foreach (var sub in subscriptions)
            {
                try 
                {
                    // Search for the resource by name in this subscription
                    // We use a filter query on Generic Resources
                    var query = $"resourceType eq 'Microsoft.Search/searchServices' and name eq '{serviceName}'";
                    var resources = sub.GetGenericResourcesAsync(query);

                    await foreach (var resource in resources)
                    {
                        if (resource.Id == null) continue;

                        // Found it
                        profile.ResourceId = resource.Id.ToString();
                        profile.SubscriptionId = sub.Data.SubscriptionId;
                        profile.ResourceGroupName = resource.Id.ResourceGroupName;
                        
                        profile.HasManagementAccess = true;
                        return;
                    }
                }
                catch(Exception ex)
                {
                    _logger.LogInformation("Skipping subscription {SubscriptionId} due to access error, internal error message: {ErrorMessage}", sub.Data.SubscriptionId, ex.Message);
				}
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve resource ID");
        }
    }

    /// <summary>
    /// Creates a TokenCredential for ARM client operations based on the profile settings.
    /// </summary>
    /// <param name="profile">The connection profile.</param>
    /// <returns>A TokenCredential instance.</returns>
    private async Task<TokenCredential> GetCredentialAsync(ConnectionProfile profile)
    {
        if (profile.AuthType == "ManagedIdentity" && profile.ManagedIdentityType == "User" && !string.IsNullOrEmpty(profile.ClientId))
        {
            return new ManagedIdentityCredential(profile.ClientId);
        }
        
        if (profile.AuthType == "AzureAD")
        {
             return await GetInteractiveCredentialAsync(profile);
        }

        // For System MI or other cases, use DefaultAzureCredential
        var options = new DefaultAzureCredentialOptions();
        if (!string.IsNullOrEmpty(profile.TenantId))
        {
            options.TenantId = profile.TenantId;
        }
        
        return new DefaultAzureCredential(options);
    }

    private async Task<TokenCredential> GetInteractiveCredentialAsync(ConnectionProfile profile)
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var authRecordPath = Path.Combine(appData, "AzureAISearchExplorer", "auth_record.bin");
        
        AuthenticationRecord? authRecord = null;

        if (File.Exists(authRecordPath))
        {
            try
            {
                using var stream = new FileStream(authRecordPath, FileMode.Open, FileAccess.Read);
                authRecord = await AuthenticationRecord.DeserializeAsync(stream);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load auth record");
            }
        }

        // Try silent auth if record exists
        if (authRecord != null)
        {
            var silentOptions = new InteractiveBrowserCredentialOptions
            {
                TokenCachePersistenceOptions = new TokenCachePersistenceOptions(),
                AuthenticationRecord = authRecord
            };
            if (!string.IsNullOrEmpty(profile.TenantId)) silentOptions.TenantId = profile.TenantId;

            var silentCredential = new InteractiveBrowserCredential(silentOptions);
            try
            {
                // Verify token acquisition
                var context = new TokenRequestContext(new[] { "https://management.azure.com/.default" });
                await silentCredential.GetTokenAsync(context);
                return silentCredential;
            }
            catch
            {
                _logger.LogWarning("Silent authentication failed, falling back to interactive");
                // Fall through to interactive
            }
        }

        // Interactive auth
        var options = new InteractiveBrowserCredentialOptions
        {
            TokenCachePersistenceOptions = new TokenCachePersistenceOptions()
        };
        if (!string.IsNullOrEmpty(profile.TenantId)) options.TenantId = profile.TenantId;

        var credential = new InteractiveBrowserCredential(options);

        try 
        {
            authRecord = await credential.AuthenticateAsync();
            
            var directory = Path.GetDirectoryName(authRecordPath);
            if (!Directory.Exists(directory)) Directory.CreateDirectory(directory!);
            
            using var stream = new FileStream(authRecordPath, FileMode.Create, FileAccess.Write);
            await authRecord.SerializeAsync(stream);
            
            return credential;
        }
        catch(Exception ex)
        {
             _logger.LogError(ex, "Interactive authentication failed");
             throw;
        }
    }
}
