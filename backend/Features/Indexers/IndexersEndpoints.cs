using Azure;
using Azure.Core;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace AzureAISearchExplorer.Backend.Features.Indexers;

public static class IndexersEndpoints
{
    private const string ApiVersion = "2023-11-01";

    private sealed record IndexerListItemDto(
        string Name,
        string? Description,
        string? DataSourceName,
        string? TargetIndexName,
        string? SkillsetName,
        bool? Disabled,
        string? ETag);

    public sealed record ResetDocumentsRequest(
        IReadOnlyList<string>? DocumentKeys,
        IReadOnlyList<string>? DatasourceDocumentIds);

    private static async Task<HttpRequestMessage> CreateSearchRestRequestAsync(
        ConnectionProfile profile,
        AuthenticationService auth,
        HttpMethod method,
        string relativePathAndQuery,
        CancellationToken cancellationToken,
        object? jsonBody = null)
    {
        var endpoint = new Uri(profile.Endpoint.TrimEnd('/'));
        var uri = new Uri(endpoint, relativePathAndQuery.TrimStart('/'));

        var request = new HttpRequestMessage(method, uri);

        if (profile.AuthType == "ApiKey" && !string.IsNullOrWhiteSpace(profile.ApiKey))
        {
            request.Headers.Add("api-key", profile.ApiKey);
        }
        else
        {
            request.Headers.Authorization = await auth.GetBearerAuthorizationHeaderAsync(profile, cancellationToken);
        }

        if (jsonBody is not null)
        {
            var json = JsonSerializer.Serialize(jsonBody, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        return request;
    }

    private static async Task<IResult> SendSearchRestNoContentAsync(HttpClient http, HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using HttpResponseMessage response = await http.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode) return Results.Accepted();

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        return Results.Problem(
            title: "Azure AI Search request failed",
            detail: string.IsNullOrWhiteSpace(body) ? response.ReasonPhrase : body,
            statusCode: (int)response.StatusCode);
    }

    public static void MapIndexersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/indexers")
            .WithTags("Indexers");

        group.MapGet("/", async (
                [FromQuery] string connectionId,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);

                Response<IReadOnlyList<SearchIndexer>> response = await client.GetIndexersAsync(cancellationToken);
                var result = response.Value.Select(indexer => new IndexerListItemDto(
                    Name: indexer.Name,
                    Description: indexer.Description,
                    DataSourceName: indexer.DataSourceName,
                    TargetIndexName: indexer.TargetIndexName,
                    SkillsetName: indexer.SkillsetName,
                    Disabled: indexer.IsDisabled,
                    ETag: indexer.ETag?.ToString()
                ));

                return Results.Ok(result);
            })
            .WithSummary("List all indexers")
            .WithDescription("Lists all indexers configured in the Azure AI Search service for the given connection.")
            .Produces<IEnumerable<IndexerListItemDto>>(StatusCodes.Status200OK);

        group.MapGet("/{indexerName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                    Response<SearchIndexer> response = await client.GetIndexerAsync(indexerName, cancellationToken);
                    return Results.Ok(response.Value);
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Get indexer")
            .WithDescription("Gets a specific indexer definition by name.")
            .Produces<SearchIndexer>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapDelete("/{indexerName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                    await client.DeleteIndexerAsync(indexerName, cancellationToken: cancellationToken);
                    return Results.NoContent();
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Delete indexer")
            .WithDescription("Deletes an indexer by name.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
                [FromQuery] string connectionId,
                [FromBody] SearchIndexer indexer,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                Response<SearchIndexer> response = await client.CreateOrUpdateIndexerAsync(indexer, cancellationToken: cancellationToken);
                return Results.Ok(response.Value);
            })
            .WithSummary("Create or update indexer")
            .WithDescription("Creates a new indexer or updates an existing one.")
            .Produces<SearchIndexer>(StatusCodes.Status200OK);

        group.MapGet("/{indexerName}/status", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                try
                {
                    SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                    Response<SearchIndexerStatus> response = await client.GetIndexerStatusAsync(indexerName, cancellationToken);
                    return Results.Ok(response.Value);
                }
                catch (RequestFailedException ex) when (ex.Status == StatusCodes.Status404NotFound)
                {
                    return Results.NotFound();
                }
            })
            .WithSummary("Get indexer status")
            .WithDescription("Gets the current status and execution history for an indexer.")
            .Produces<SearchIndexerStatus>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{indexerName}/run", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                await client.RunIndexerAsync(indexerName, cancellationToken);
                return Results.Accepted();
            })
            .WithSummary("Run indexer")
            .WithDescription("Triggers an indexer run.")
            .Produces(StatusCodes.Status202Accepted);

        group.MapPost("/{indexerName}/reset", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                SearchClientFactory factory,
                CancellationToken cancellationToken) =>
            {
                SearchIndexerClient client = await factory.CreateIndexerClientAsync(connectionId);
                await client.ResetIndexerAsync(indexerName, cancellationToken);
                return Results.Accepted();
            })
            .WithSummary("Reset indexer")
            .WithDescription("Resets an indexer, clearing its change tracking state.")
            .Produces(StatusCodes.Status202Accepted);

        group.MapPost("/{indexerName}/resync", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile is null) return Results.NotFound(new ProblemDetails { Title = "Connection profile not found" });

                // POST /indexers/{name}/search.resync
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Post,
                    $"/indexers/{Uri.EscapeDataString(indexerName)}/search.resync?api-version={ApiVersion}",
                    cancellationToken);

                using var http = httpClientFactory.CreateClient();
                return await SendSearchRestNoContentAsync(http, request, cancellationToken);
            })
            .WithSummary("Resync indexer")
            .WithDescription("Requests the indexer to re-evaluate and resync changed data from the datasource.")
            .Produces(StatusCodes.Status202Accepted);

        group.MapPost("/{indexerName}/reset-docs", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexerName,
                [FromBody] ResetDocumentsRequest request,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
            IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var docKeys = (request.DocumentKeys ?? Array.Empty<string>()).Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToArray();
                var datasourceIds = (request.DatasourceDocumentIds ?? Array.Empty<string>()).Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToArray();

                if (docKeys.Length == 0 && datasourceIds.Length == 0)
                {
                    return Results.BadRequest(new ProblemDetails { Title = "No document keys provided", Detail = "Provide at least one of documentKeys or datasourceDocumentIds." });
                }

                var profile = await repository.GetByIdAsync(connectionId);
                if (profile is null) return Results.NotFound(new ProblemDetails { Title = "Connection profile not found" });

                // POST /indexers/{name}/search.resetdocs
                var body = new
                {
                    documentKeys = docKeys.Length > 0 ? docKeys : null,
                    datasourceDocumentIds = datasourceIds.Length > 0 ? datasourceIds : null
                };

                var httpRequest = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Post,
                    $"/indexers/{Uri.EscapeDataString(indexerName)}/search.resetdocs?api-version={ApiVersion}",
                    cancellationToken,
                    jsonBody: body);

                using var http = httpClientFactory.CreateClient();
                return await SendSearchRestNoContentAsync(http, httpRequest, cancellationToken);
            })
            .WithSummary("Reset specific documents")
            .WithDescription("Resets specific documents for an indexer. Provide either document keys (search index keys) or datasource document ids.")
            .Produces(StatusCodes.Status202Accepted)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
