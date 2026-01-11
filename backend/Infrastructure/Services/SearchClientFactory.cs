using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;

namespace AzureAISearchExplorer.Backend.Infrastructure.Services;

public class SearchClientFactory
{
	private readonly IRepository<ConnectionProfile> _repository;
	private readonly AuthenticationService _authService;

	public SearchClientFactory(IRepository<ConnectionProfile> repository, AuthenticationService authService)
	{
		_repository = repository;
		_authService = authService;
	}

	public async Task<SearchIndexClient> CreateIndexClientAsync(string connectionId)
	{
		var profile = await _repository.GetByIdAsync(connectionId);
		if (profile == null)
			throw new ArgumentException("Connection profile not found", nameof(connectionId));

		var endpoint = new Uri(profile.Endpoint);

		if (profile.AuthType == "ApiKey" && !string.IsNullOrEmpty(profile.ApiKey))
		{
			return new SearchIndexClient(endpoint, new AzureKeyCredential(profile.ApiKey));
		}
		else
		{
			var credential = await _authService.GetCredentialAsync(profile);
			return new SearchIndexClient(endpoint, credential);
		}
	}

	public async Task<SearchClient> CreateSearchClientAsync(string connectionId, string indexName)
	{
		var profile = await _repository.GetByIdAsync(connectionId);
		if (profile == null)
			throw new ArgumentException("Connection profile not found", nameof(connectionId));

		var endpoint = new Uri(profile.Endpoint);

		if (profile.AuthType == "ApiKey" && !string.IsNullOrEmpty(profile.ApiKey))
		{
			return new SearchClient(endpoint, indexName, new AzureKeyCredential(profile.ApiKey));
		}
		else
		{
			var credential = await _authService.GetCredentialAsync(profile);
			return new SearchClient(endpoint, indexName, credential);
		}
	}

	public async Task<SearchIndexerClient> CreateIndexerClientAsync(string connectionId)
	{
		var profile = await _repository.GetByIdAsync(connectionId);
		if (profile == null)
			throw new ArgumentException("Connection profile not found", nameof(connectionId));

		var endpoint = new Uri(profile.Endpoint);

		if (profile.AuthType == "ApiKey" && !string.IsNullOrEmpty(profile.ApiKey))
		{
			return new SearchIndexerClient(endpoint, new AzureKeyCredential(profile.ApiKey));
		}
		else
		{
			var credential = await _authService.GetCredentialAsync(profile);
			return new SearchIndexerClient(endpoint, credential);
		}
	}
}
