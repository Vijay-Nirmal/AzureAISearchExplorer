using Azure;
using Azure.Identity;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;

namespace AzureAISearchExplorer.Backend.Infrastructure.Services;

public class SearchClientFactory
{
    private readonly IRepository<ConnectionProfile> _repository;

    public SearchClientFactory(IRepository<ConnectionProfile> repository)
    {
        _repository = repository;
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
            // Default to Azure AD (RBAC)
            return new SearchIndexClient(endpoint, new DefaultAzureCredential());
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
            return new SearchClient(endpoint, indexName, new DefaultAzureCredential());
        }
    }
}
