using Azure;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzureAISearchExplorer.Backend.Features.DataSources;

public static class DataSourcesEndpoints
{
	private sealed record DataSourceListItemDto(
		string Name,
		string? Description,
		string? Type,
		string? ContainerName,
		string? ETag);

	public static void MapDataSourcesEndpoints(this IEndpointRouteBuilder app)
	{
		var group = app.MapGroup("/api/datasources")
			.WithTags("Data Sources");

		group.MapGet("/", async (
				[FromQuery] string connectionId,
				SearchClientFactory factory,
				CancellationToken cancellationToken) =>
			{
				SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
				Response<IReadOnlyList<SearchIndexerDataSourceConnection>> response = await client.GetDataSourceConnectionsAsync(cancellationToken);

				var result = response.Value.Select(ds => new DataSourceListItemDto(
					Name: ds.Name,
					Description: ds.Description,
					Type: ds.Type.ToString(),
					ContainerName: ds.Container?.Name,
					ETag: ds.ETag?.ToString()
				));

				return Results.Ok(result);
			})
			.WithSummary("List all data sources")
			.WithDescription("Lists all datasource connections configured in the Azure AI Search service for the given connection.")
			.Produces<IEnumerable<DataSourceListItemDto>>(StatusCodes.Status200OK);

		group.MapGet("/{dataSourceName}", async (
				[FromQuery] string connectionId,
				[FromRoute] string dataSourceName,
				SearchClientFactory factory,
				CancellationToken cancellationToken) =>
			{
				try
				{
					SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
					Response<SearchIndexerDataSourceConnection> response = await client.GetDataSourceConnectionAsync(dataSourceName, cancellationToken);
					return Results.Ok(response.Value);
				}
				catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
				{
					return Results.NotFound();
				}
			})
			.WithSummary("Get data source")
			.WithDescription("Gets a specific datasource connection definition by name.")
			.Produces<SearchIndexerDataSourceConnection>(StatusCodes.Status200OK)
			.ProducesProblem(StatusCodes.Status404NotFound);

		group.MapDelete("/{dataSourceName}", async (
				[FromQuery] string connectionId,
				[FromRoute] string dataSourceName,
				SearchClientFactory factory,
				CancellationToken cancellationToken) =>
			{
				try
				{
					SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
					await client.DeleteDataSourceConnectionAsync(dataSourceName, cancellationToken: cancellationToken);
					return Results.NoContent();
				}
				catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
				{
					return Results.NotFound();
				}
			})
			.WithSummary("Delete data source")
			.WithDescription("Deletes a datasource connection by name.")
			.Produces(StatusCodes.Status204NoContent)
			.ProducesProblem(StatusCodes.Status404NotFound);

		group.MapPost("/", async (
				[FromQuery] string connectionId,
				[FromBody] SearchIndexerDataSourceConnection dataSource,
				SearchClientFactory factory,
				CancellationToken cancellationToken) =>
			{
				SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
				Response<SearchIndexerDataSourceConnection> response = await client.CreateOrUpdateDataSourceConnectionAsync(dataSource, cancellationToken: cancellationToken);
				return Results.Ok(response.Value);
			})
			.WithSummary("Create or update data source")
			.WithDescription("Creates a new datasource connection or updates an existing one.")
			.Produces<SearchIndexerDataSourceConnection>(StatusCodes.Status200OK);
	}
}
