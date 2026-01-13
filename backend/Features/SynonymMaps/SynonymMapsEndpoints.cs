using Azure;
using Azure.Search.Documents.Indexes.Models;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzureAISearchExplorer.Backend.Features.SynonymMaps;

public static class SynonymMapsEndpoints
{
    public static void MapSynonymMapsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/synonymmaps")
            .WithTags("Synonym Maps");

        group.MapGet("/", async (
                [FromQuery] string connectionId,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                var client = await factory.CreateIndexClientAsync(connectionId);
                Response<IReadOnlyList<SynonymMap>> response = await client.GetSynonymMapsAsync(cancellationToken);
                return Results.Ok(response.Value);
            })
            .WithSummary("List synonym maps")
            .WithDescription("Lists all synonym maps configured in the Azure AI Search service for the given connection.")
            .Produces<IEnumerable<SynonymMap>>(StatusCodes.Status200OK);

        group.MapGet("/{synonymMapName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string synonymMapName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var client = await factory.CreateIndexClientAsync(connectionId);
                    var response = await client.GetSynonymMapAsync(synonymMapName, cancellationToken);
                    return Results.Ok(response.Value);
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Get synonym map")
            .WithDescription("Gets a synonym map definition by name.")
            .Produces<SynonymMap>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
                [FromQuery] string connectionId,
                [FromBody] SynonymMap synonymMap,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                var client = await factory.CreateIndexClientAsync(connectionId);
                var response = await client.CreateOrUpdateSynonymMapAsync(synonymMap, cancellationToken: cancellationToken);
                return Results.Ok(response.Value);
            })
            .WithSummary("Create or update synonym map")
            .WithDescription("Creates a new synonym map or updates an existing one.")
            .Produces<SynonymMap>(StatusCodes.Status200OK);

        group.MapDelete("/{synonymMapName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string synonymMapName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    var client = await factory.CreateIndexClientAsync(connectionId);
                    await client.DeleteSynonymMapAsync(synonymMapName, cancellationToken);
                    return Results.NoContent();
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Delete synonym map")
            .WithDescription("Deletes a synonym map by name.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
