using Azure;
using Azure.Core;
using Azure.ResourceManager;
using Azure.ResourceManager.Search;
using Azure.ResourceManager.Search.Models;
using Azure.Search.Documents.Indexes;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;

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
			.WithTags("Service");

		// Endpoint to test connectivity to the search service using the provided profile
		group.MapPost("/test", async (ConnectionProfile profile, AuthenticationService authService) =>
		{
			try
			{
				var client = await CreateIndexClientAsync(profile, authService);
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
		group.MapGet("/{connectionId}/overview", async (string connectionId, IRepository<ConnectionProfile> repo, ILoggerFactory loggerFactory, AuthenticationService authService) =>
		{
			var logger = loggerFactory.CreateLogger("ServiceEndpoints");
			var profile = await repo.GetByIdAsync(connectionId);
			if (profile == null) return Results.NotFound("Connection not found");

			try
			{
				var client = await CreateIndexClientAsync(profile, authService);
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
						var credential = await authService.GetCredentialAsync(profile);
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

						// Extended Details
						overview.NetworkRuleSet = System.Text.Json.JsonSerializer.Serialize(data.Value.Data.NetworkRuleSet);
						overview.DisableLocalAuth = data.Value.Data.IsLocalAuthDisabled;
						overview.AuthOptions = System.Text.Json.JsonSerializer.Serialize(data.Value.Data.AuthOptions);
						overview.EncryptionWithCmk = data.Value.Data.EncryptionWithCmk?.Enforcement?.ToString();
						overview.PrivateEndpointConnections = data.Value.Data.PrivateEndpointConnections.Select(x => x.Id.ToString());
						overview.SharedPrivateLinkResources = data.Value.Data.SharedPrivateLinkResources.Select(x => x.Id.ToString());
						overview.SystemDataCreatedAt = data.Value.Data.SystemData?.CreatedOn?.ToString("o");
						overview.SystemDataCreatedBy = data.Value.Data.SystemData?.CreatedBy;
						overview.SystemDataLastModifiedAt = data.Value.Data.SystemData?.LastModifiedOn?.ToString("o");
						overview.SystemDataLastModifiedBy = data.Value.Data.SystemData?.LastModifiedBy;
						overview.ProvisioningState = data.Value.Data.ProvisioningState.ToString();
						overview.SemanticSearch = data.Value.Data.SemanticSearch?.ToString();
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

		// Endpoint to update the search service settings
		group.MapPut("/{connectionId}/update", async (string connectionId, [FromBody] UpdateServiceRequest request, IRepository<ConnectionProfile> repo, AuthenticationService authService) =>
		{
			if (string.IsNullOrEmpty(request.ResourceId)) return Results.BadRequest("ResourceId is required");

			var profile = await repo.GetByIdAsync(connectionId);
			if (profile == null) return Results.NotFound("Connection not found");

			try
			{
				var credential = await authService.GetCredentialAsync(profile);
				var armClient = new ArmClient(credential);
				var resourceId = new ResourceIdentifier(request.ResourceId);
				var searchService = armClient.GetSearchServiceResource(resourceId);

				var currentService = await searchService.GetAsync();
				var patchData = new SearchServicePatch(currentService.Value.Data.Location);

				if (request.PublicNetworkAccess.HasValue)
					patchData.PublicNetworkAccess = request.PublicNetworkAccess.Value ? SearchServicePublicNetworkAccess.Enabled : SearchServicePublicNetworkAccess.Disabled;

				if (request.DisableLocalAuth.HasValue)
					patchData.IsLocalAuthDisabled = request.DisableLocalAuth.Value;

				await searchService.UpdateAsync(patchData);

				return Results.Ok();
			}
			catch (Exception ex)
			{
				return Results.Problem(ex.Message);
			}
		})
		.WithSummary("Endpoint to update the search service settings");

		// Endpoint to scale the search service (replicas and partitions)
		group.MapPut("/{connectionId}/scale", async (string connectionId, [FromBody] ScaleRequest request, IRepository<ConnectionProfile> repo, AuthenticationService authService) =>
		{
			if (string.IsNullOrEmpty(request.ResourceId)) return Results.BadRequest("ResourceId is required");

			var profile = await repo.GetByIdAsync(connectionId);
			if (profile == null) return Results.NotFound("Connection not found");

			try
			{
				var credential = await authService.GetCredentialAsync(profile);
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

		// Endpoint to clear authentication cache
		group.MapPost("/clear-auth-cache", (AuthenticationService authService) =>
		{
			authService.ClearCache();
			return Results.Ok(new { Message = "Authentication cache cleared." });
		})
		.WithSummary("Endpoint to clear authentication cache");
	}

	public class ScaleRequest
	{
		public string ResourceId { get; set; } = string.Empty;
		public int? ReplicaCount { get; set; }
		public int? PartitionCount { get; set; }
	}

	public class UpdateServiceRequest
	{
		public string ResourceId { get; set; } = string.Empty;
		public bool? PublicNetworkAccess { get; set; }
		public bool? DisableLocalAuth { get; set; }
	}

	/// <summary>
	/// Creates a SearchIndexClient using either an API Key or TokenCredential.
	/// </summary>
	/// <param name="profile">The connection profile.</param>
	/// <param name="authService">The authentication service.</param>
	/// <returns>A configured SearchIndexClient.</returns>
	private static async Task<SearchIndexClient> CreateIndexClientAsync(ConnectionProfile profile, AuthenticationService authService)
	{
		var endpoint = new Uri(profile.Endpoint);

		if (profile.AuthType == "ApiKey" && !string.IsNullOrEmpty(profile.ApiKey))
		{
			var credential = new AzureKeyCredential(profile.ApiKey);
			return new SearchIndexClient(endpoint, credential);
		}
		else
		{
			return new SearchIndexClient(endpoint, await authService.GetCredentialAsync(profile));
		}
	}
}
