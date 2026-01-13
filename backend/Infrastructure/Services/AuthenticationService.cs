using Azure.Core;
using Azure.Identity;
using AzureAISearchExplorer.Backend.Shared.Models;
using System.Collections.Concurrent;
using System.Net.Http.Headers;

namespace AzureAISearchExplorer.Backend.Infrastructure.Services;

public class AuthenticationService
{
    private const string SearchScope = "https://search.azure.com/.default";
	private readonly ILogger<AuthenticationService> _logger;
	private readonly ConcurrentDictionary<string, TokenCredential> _credentialCache = new();

	public AuthenticationService(ILogger<AuthenticationService> logger)
	{
		_logger = logger;
	}

	/// <summary>
	/// Creates or retrieves a cached TokenCredential based on the connection profile's authentication settings.
	/// Handles User-Assigned Managed Identity, System-Assigned Managed Identity, and Azure AD (Interactive/Silent).
	/// </summary>
	/// <param name="profile">The connection profile.</param>
	/// <returns>A TokenCredential instance.</returns>
	public async Task<TokenCredential> GetCredentialAsync(ConnectionProfile profile)
	{
		// Simple caching key based on profile ID and auth type
		var key = $"{profile.Id}-{profile.AuthType}-{profile.TenantId}-{profile.ClientId}";

		if (_credentialCache.TryGetValue(key, out var cachedCredential))
		{
			return cachedCredential;
		}

		TokenCredential credential;

		if (profile.AuthType == "ManagedIdentity" && profile.ManagedIdentityType == "User" && !string.IsNullOrEmpty(profile.ClientId))
		{
			credential = new ManagedIdentityCredential(profile.ClientId);
		}
		else if (profile.AuthType == "AzureAD")
		{
			credential = await GetInteractiveCredentialAsync(profile);
		}
		else
		{
			// For System MI or other cases, use DefaultAzureCredential
			var options = new DefaultAzureCredentialOptions();
			if (!string.IsNullOrEmpty(profile.TenantId))
			{
				options.TenantId = profile.TenantId;
			}
			credential = new DefaultAzureCredential(options);
		}

		_credentialCache.TryAdd(key, credential);

		return credential;
	}

	/// <summary>
	/// Gets a Bearer <see cref="AuthenticationHeaderValue"/> for Azure AD-based auth.
	/// Returns <c>null</c> for API key auth.
	/// </summary>
	public async Task<AuthenticationHeaderValue?> GetBearerAuthorizationHeaderAsync(
		ConnectionProfile profile,
		CancellationToken cancellationToken)
	{
		if (profile.AuthType == "ApiKey") return null;

		TokenCredential credential = await GetCredentialAsync(profile);
		AccessToken token = await credential.GetTokenAsync(new TokenRequestContext(new[] { SearchScope }), cancellationToken);
		return new AuthenticationHeaderValue("Bearer", token.Token);
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
		catch (Exception ex)
		{
			_logger.LogError(ex, "Interactive authentication failed");
			throw;
		}
	}

	public void ClearCache()
	{
		_credentialCache.Clear();

		var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
		var authRecordPath = Path.Combine(appData, "AzureAISearchExplorer", "auth_record.bin");
		if (File.Exists(authRecordPath))
		{
			try
			{
				File.Delete(authRecordPath);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to delete auth record");
			}
		}
	}
}
