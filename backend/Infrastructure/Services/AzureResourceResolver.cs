using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Resources;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.Extensions.Logging;

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
            var credential = GetCredential(profile);
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
    private TokenCredential GetCredential(ConnectionProfile profile)
    {
        if (profile.AuthType == "ManagedIdentity" && profile.ManagedIdentityType == "User" && !string.IsNullOrEmpty(profile.ClientId))
        {
            return new ManagedIdentityCredential(profile.ClientId);
        }
        
        // For System MI or Azure AD (local dev), use DefaultAzureCredential
        // We can pass TenantId if provided to scope it
        var options = new DefaultAzureCredentialOptions();
        if (!string.IsNullOrEmpty(profile.TenantId))
        {
            options.TenantId = profile.TenantId;
        }
        
        return new DefaultAzureCredential(options);
    }
}
