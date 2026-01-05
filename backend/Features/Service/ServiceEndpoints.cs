using Azure;
using Azure.Core;
using Azure.Identity;
using Azure.ResourceManager;
using Azure.ResourceManager.Search;
using Azure.ResourceManager.Search.Models;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Features.Service;

public static class ServiceEndpoints
{
    /// <summary>
    /// Maps the service-level endpoints for Azure AI Search.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    public static void MapServiceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/service")
            .WithTags("Service")
            .WithOpenApi();

        // Endpoint to test connectivity to the search service using the provided profile
        group.MapPost("/test", async (ConnectionProfile profile) =>
        {
            try
            {
                var client = CreateIndexClient(profile);
                // Try to list indexes as a connectivity check
                await client.GetIndexNamesAsync().GetAsyncEnumerator().MoveNextAsync();
                return Results.Ok(new { Success = true, Message = "Successfully connected." });
            }
            catch (Exception ex)
            {
                return Results.Ok(new { Success = false, Message = ex.Message });
            }
        })
        .WithSummary("Endpoint to test connectivity to the search service using the provided profile");

        // Endpoint to get a comprehensive overview of the search service (stats + management info)
        group.MapGet("/{connectionId}/overview", async (string connectionId, IRepository<ConnectionProfile> repo, ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("ServiceEndpoints");
            var profile = await repo.GetByIdAsync(connectionId);
            if (profile == null) return Results.NotFound("Connection not found");

            try
            {
                var client = CreateIndexClient(profile);
                var stats = await client.GetServiceStatisticsAsync();
                
                var overview = new ServiceFullOverview
                {
                    Stats = stats.Value,
                    Endpoint = profile.Endpoint,
                    Name = profile.Name,
                    IsManagementAvailable = false
                };

                // Attempt to fetch Management Plane details if available
                if (profile.HasManagementAccess == true && !string.IsNullOrEmpty(profile.ResourceId))
                {
                    try 
                    {
                        var credential = GetTokenCredential(profile);
                        var armClient = new ArmClient(credential);
                        var resourceId = new ResourceIdentifier(profile.ResourceId);
                        var searchService = armClient.GetSearchServiceResource(resourceId);
                        var data = await searchService.GetAsync();
                        
                        overview.Location = data.Value.Data.Location.Name;
						overview.Sku = data.Value.Data.SearchSkuName.ToString();
						overview.ReplicaCount = data.Value.Data.ReplicaCount;
                        overview.PartitionCount = data.Value.Data.PartitionCount;
                        overview.Status = data.Value.Data.Status.ToString();
                        overview.HostingMode = data.Value.Data.HostingMode.ToString();
                        overview.PublicNetworkAccess = data.Value.Data.PublicNetworkAccess.ToString();
                        overview.Tags = data.Value.Data.Tags;
                        overview.IsManagementAvailable = true;
                        overview.ResourceId = profile.ResourceId;
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the request, just return what we have
                        logger.LogWarning(ex, "Failed to fetch management details");
                    }
                }

                return Results.Ok(overview);
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithSummary("Endpoint to get a comprehensive overview of the search service (stats + management info)");

        // Endpoint to scale the search service (replicas and partitions)
        group.MapPut("/{connectionId}/scale", async (string connectionId, [FromBody] ScaleRequest request, IRepository<ConnectionProfile> repo) =>
        {
            if (string.IsNullOrEmpty(request.ResourceId)) return Results.BadRequest("ResourceId is required");
            
            var profile = await repo.GetByIdAsync(connectionId);
            if (profile == null) return Results.NotFound("Connection not found");

            try
            {
                var credential = GetTokenCredential(profile);
                var armClient = new ArmClient(credential);
                var resourceId = new ResourceIdentifier(request.ResourceId);
                var searchService = armClient.GetSearchServiceResource(resourceId);
                
                // Fetch the current resource to get the correct location
                var currentService = await searchService.GetAsync();
                
                var patchData = new SearchServicePatch(currentService.Value.Data.Location);
                if (request.ReplicaCount.HasValue) patchData.ReplicaCount = request.ReplicaCount.Value;
                if (request.PartitionCount.HasValue) patchData.PartitionCount = request.PartitionCount.Value;

                await searchService.UpdateAsync(patchData);
                
                return Results.Ok();
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        })
        .WithSummary("Endpoint to scale the search service (replicas and partitions)");
    }

    public class ScaleRequest
    {
        public string ResourceId { get; set; } = string.Empty;
        public int? ReplicaCount { get; set; }
        public int? PartitionCount { get; set; }
    }

    /// <summary>
    /// Creates a TokenCredential based on the connection profile's authentication settings.
    /// Handles User-Assigned Managed Identity, System-Assigned Managed Identity, and Azure AD (DefaultAzureCredential).
    /// </summary>
    /// <param name="profile">The connection profile.</param>
    /// <returns>A TokenCredential instance.</returns>
    private static TokenCredential GetTokenCredential(ConnectionProfile profile)
    {
        if (profile.AuthType == "ManagedIdentity" && profile.ManagedIdentityType == "User" && !string.IsNullOrEmpty(profile.ClientId))
        {
            return new ManagedIdentityCredential(profile.ClientId);
        }
        
        var options = new DefaultAzureCredentialOptions();
        if (!string.IsNullOrEmpty(profile.TenantId))
        {
            options.TenantId = profile.TenantId;
        }
        return new DefaultAzureCredential(options);
    }

    /// <summary>
    /// Creates a SearchIndexClient using either an API Key or TokenCredential.
    /// </summary>
    /// <param name="profile">The connection profile.</param>
    /// <returns>A configured SearchIndexClient.</returns>
    private static SearchIndexClient CreateIndexClient(ConnectionProfile profile)
    {
        var endpoint = new Uri(profile.Endpoint);

        if (profile.AuthType == "ApiKey" && !string.IsNullOrEmpty(profile.ApiKey))
        {
            var credential = new AzureKeyCredential(profile.ApiKey);
            return new SearchIndexClient(endpoint, credential);
        }
        else
        {
            return new SearchIndexClient(endpoint, GetTokenCredential(profile));
        }
    }
}
