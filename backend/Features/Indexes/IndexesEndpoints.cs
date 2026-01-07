using Azure.Search.Documents;
using Azure.Search.Documents.Indexes.Models;
using Azure.Search.Documents.Models;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzureAISearchExplorer.Backend.Features.Indexes;

public static class IndexesEndpoints
{
	public static void MapIndexesEndpoints(this IEndpointRouteBuilder app)
	{
		var group = app.MapGroup("/api/indexes")
			.WithTags("Indexes");

		// List Indexes
		group.MapGet("/", async ([FromQuery] string connectionId, SearchClientFactory factory) =>
		{
			try
			{
				var client = await factory.CreateIndexClientAsync(connectionId);
				var indexes = new List<SearchIndex>();
				await foreach (var page in client.GetIndexesAsync())
				{
					indexes.Add(page);
				}

				// Fetching statistics for each index (Note: This can be slow for many indexes)
				var result = new List<object>();
				foreach (var index in indexes)
				{
					SearchIndexStatistics? stats = null;
					try
					{
						stats = await client.GetIndexStatisticsAsync(index.Name);
					}
					catch { }

					result.Add(new
					{
						index.Name,
						index.Fields,
						index.VectorSearch,
						index.SemanticSearch,
						index.ETag,
						Stats = stats
					});
				}

				return Results.Ok(result);
			}
			catch (Exception ex)
			{
				return Results.Problem(ex.Message);
			}
		})
		.WithSummary("List all indexes with statistics");

		// Get Index Definition
		group.MapGet("/{indexName}", async ([FromQuery] string connectionId, string indexName, SearchClientFactory factory) =>
		{
			try
			{
				var client = await factory.CreateIndexClientAsync(connectionId);
				var index = await client.GetIndexAsync(indexName);
				return Results.Ok(index.Value);
			}
			catch (Exception ex)
			{
				return Results.Problem(ex.Message);
			}
		})
		.WithSummary("Get specific index definition");

		// Delete Index
		group.MapDelete("/{indexName}", async ([FromQuery] string connectionId, string indexName, SearchClientFactory factory) =>
		{
			try
			{
				var client = await factory.CreateIndexClientAsync(connectionId);
				await client.DeleteIndexAsync(indexName);
				return Results.NoContent();
			}
			catch (Exception ex)
			{
				return Results.Problem(ex.Message);
			}
		})
		.WithSummary("Delete an index");

		// Create or Update Index
		group.MapPost("/", async ([FromQuery] string connectionId, [FromBody] SearchIndex index, SearchClientFactory factory) =>
		{
			try
			{
				var client = await factory.CreateIndexClientAsync(connectionId);
				await client.CreateOrUpdateIndexAsync(index);
				return Results.Ok(index);
			}
			catch (Exception ex)
			{
				return Results.Problem(ex.Message);
			}
		})
		.WithSummary("Create or Update an index");

		// Query Index (Simple/Lucene)
		group.MapPost("/{indexName}/query", async ([FromQuery] string connectionId, string indexName, [FromBody] SearchOptions options, [FromQuery] string? searchText, SearchClientFactory factory) =>
		{
			try
			{
				var client = await factory.CreateSearchClientAsync(connectionId, indexName);
				// SearchText can be null for "*"

				// We execute the search
				// Use generic Search<SearchDocument> to get dynamic results
				SearchResults<SearchDocument> response = await client.SearchAsync<SearchDocument>(searchText ?? "*", options);

				var results = new List<SearchDocument>();
				await foreach (var doc in response.GetResultsAsync())
				{
					// Add score to the document dictionary if possible, or return wrapper
					doc.Document["@search.score"] = doc.Score;
					doc.Document["@search.highlights"] = doc.Highlights;
					results.Add(doc.Document);
				}

				return Results.Ok(new
				{
					Count = response.TotalCount,
					Results = results,
					// Facets could be added here
				});
			}
			catch (Exception ex)
			{
				return Results.Problem(ex.Message);
			}
		})
		.WithSummary("Execute a search query on the index");
	}
}
