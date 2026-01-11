using Azure;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace AzureAISearchExplorer.Backend.Features.Skillsets;

public static class SkillsetsEndpoints
{
    private sealed record SkillsetListItemDto(string Name, string? Description, int SkillsCount, string? ETag);

    public static void MapSkillsetsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/skillsets")
            .WithTags("Skillsets");

        group.MapGet("/", async (
                [FromQuery] string connectionId,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);

                Response<IReadOnlyList<SearchIndexerSkillset>> response = await client.GetSkillsetsAsync(cancellationToken);
                var result = response.Value.Select(skillset => new SkillsetListItemDto(
                    Name: skillset.Name,
                    Description: skillset.Description,
                    SkillsCount: skillset.Skills?.Count ?? 0,
                    ETag: skillset.ETag?.ToString()
                ));

                return Results.Ok(result);
            })
            .WithSummary("List all skillsets")
            .WithDescription("Lists all skillsets configured in the Azure AI Search service for the given connection.")
            .Produces<IEnumerable<SkillsetListItemDto>>(StatusCodes.Status200OK);

        group.MapGet("/{skillsetName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string skillsetName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                    Response<SearchIndexerSkillset> response = await client.GetSkillsetAsync(skillsetName, cancellationToken);
                    return Results.Ok(response.Value);
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Get skillset")
            .WithDescription("Gets a specific skillset definition by name.")
            .Produces<SearchIndexerSkillset>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{skillsetName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string skillsetName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                    await client.DeleteSkillsetAsync(skillsetName, cancellationToken: cancellationToken);
                    return Results.NoContent();
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Delete skillset")
            .WithDescription("Deletes a skillset by name.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
                [FromQuery] string connectionId,
                [FromBody] SearchIndexerSkillset skillset,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                Response<SearchIndexerSkillset> response = await client.CreateOrUpdateSkillsetAsync(skillset, cancellationToken: cancellationToken);
                return Results.Ok(response.Value);
            })
            .WithSummary("Create or update skillset")
            .WithDescription("Creates a new skillset or updates an existing one.")
            .Produces<SearchIndexerSkillset>(StatusCodes.Status200OK);
    }
}
