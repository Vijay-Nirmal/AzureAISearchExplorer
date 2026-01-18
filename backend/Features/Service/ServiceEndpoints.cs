using Azure;
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


		// Endpoint to clear authentication cache
		group.MapPost("/clear-auth-cache", (AuthenticationService authService) =>
		{
			authService.ClearCache();
			return Results.Ok(new { Message = "Authentication cache cleared." });
		})
		.WithSummary("Endpoint to clear authentication cache");

		// Endpoint to get the auth header for Azure AI Search REST calls
		group.MapGet("/{connectionId}/auth-header", async (
				string connectionId,
				IRepository<ConnectionProfile> repo,
				AuthenticationService authService,
				CancellationToken cancellationToken) =>
			{
				var profile = await repo.GetByIdAsync(connectionId);
				if (profile == null) return Results.NotFound("Connection not found");

				var header = await authService.GetSearchAuthHeaderAsync(profile, cancellationToken);
				if (header is null) return Results.BadRequest("Authentication information missing or invalid");

				return Results.Ok(new SearchAuthHeaderDto(header.Value.Name, header.Value.Value));
			})
			.WithSummary("Get auth header for Azure AI Search REST calls")
			.WithDescription("Returns the header name and value required to call Azure AI Search REST APIs for the specified connection.")
			.Produces<SearchAuthHeaderDto>(StatusCodes.Status200OK)
			.ProducesProblem(StatusCodes.Status400BadRequest)
			.ProducesProblem(StatusCodes.Status404NotFound);

		// Endpoint to get the auth header using a provided connection profile
		group.MapPost("/auth-header", async (
				[FromBody] ConnectionProfile profile,
				AuthenticationService authService,
				CancellationToken cancellationToken) =>
			{
				var header = await authService.GetSearchAuthHeaderAsync(profile, cancellationToken);
				if (header is null) return Results.BadRequest("Authentication information missing or invalid");

				return Results.Ok(new SearchAuthHeaderDto(header.Value.Name, header.Value.Value));
			})
			.WithSummary("Get auth header for Azure AI Search REST calls")
			.WithDescription("Returns the header name and value required to call Azure AI Search REST APIs using the supplied connection profile.")
			.Produces<SearchAuthHeaderDto>(StatusCodes.Status200OK)
			.ProducesProblem(StatusCodes.Status400BadRequest);
	}

	private sealed record SearchAuthHeaderDto(string Name, string Value);

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
