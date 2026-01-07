using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;

namespace AzureAISearchExplorer.Backend.Features.Connections;

public static class ConnectionsEndpoints
{
	/// <summary>
	/// Maps the connection profile management endpoints.
	/// </summary>
	/// <param name="app">The endpoint route builder.</param>
	public static void MapConnectionsEndpoints(this IEndpointRouteBuilder app)
	{
		var group = app.MapGroup("/api/connections")
			.WithTags("Connections");

		// Endpoint to retrieve all saved connection profiles
		group.MapGet("/", async (IRepository<ConnectionProfile> repo) =>
		{
			return Results.Ok(await repo.GetAllAsync());
		})
		.WithSummary("Endpoint to retrieve all saved connection profiles");

		// Endpoint to retrieve a specific connection profile by its ID
		group.MapGet("/{id}", async (string id, IRepository<ConnectionProfile> repo) =>
		{
			var item = await repo.GetByIdAsync(id);
			return item is not null ? Results.Ok(item) : Results.NotFound();
		})
		.WithSummary("Endpoint to retrieve a specific connection profile by its ID");

		// Endpoint to create a new connection profile and resolve its Azure Resource ID
		group.MapPost("/", async (ConnectionProfile profile, IRepository<ConnectionProfile> repo, AzureResourceResolver resolver) =>
		{
			await resolver.ResolveResourceIdAsync(profile);
			await repo.AddAsync(profile);
			return Results.Created($"/api/connections/{profile.Id}", profile);
		})
		.WithSummary("Endpoint to create a new connection profile and resolve its Azure Resource ID");

		// Endpoint to update an existing connection profile and re-resolve its Azure Resource ID
		group.MapPut("/{id}", async (string id, ConnectionProfile profile, IRepository<ConnectionProfile> repo, AzureResourceResolver resolver) =>
		{
			if (id != profile.Id) return Results.BadRequest();
			await resolver.ResolveResourceIdAsync(profile);
			await repo.UpdateAsync(profile);
			return Results.NoContent();
		})
		.WithSummary("Endpoint to update an existing connection profile and re-resolve its Azure Resource ID");

		// Endpoint to delete a connection profile
		group.MapDelete("/{id}", async (string id, IRepository<ConnectionProfile> repo) =>
		{
			await repo.DeleteAsync(id);
			return Results.NoContent();
		})
		.WithSummary("Endpoint to delete a connection profile");
	}
}
