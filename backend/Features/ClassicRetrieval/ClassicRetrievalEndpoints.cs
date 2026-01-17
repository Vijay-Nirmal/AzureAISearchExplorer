using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace AzureAISearchExplorer.Backend.Features.ClassicRetrieval;

public static class ClassicRetrievalEndpoints
{
    // Use the Search REST API directly so the UI can send/receive raw payloads.
    // Default to a recent preview to maximize feature surface (vector, debug, etc.).
    // Allow overriding via query string when needed.
    private const string DefaultApiVersion = "2025-11-01-preview";

    private static async Task<HttpRequestMessage> CreateSearchRestRequestAsync(
        ConnectionProfile profile,
        AuthenticationService auth,
        HttpMethod method,
        string relativePathAndQuery,
        CancellationToken cancellationToken,
        string? rawJsonBody = null)
    {
        var endpoint = profile.Endpoint.TrimEnd('/');
        var url = new Uri($"{endpoint}/{relativePathAndQuery.TrimStart('/')}");

        var request = new HttpRequestMessage(method, url);
        await auth.TryApplySearchAuthHeaderAsync(request.Headers, profile, cancellationToken);

        if (!string.IsNullOrWhiteSpace(rawJsonBody))
        {
            request.Content = new StringContent(rawJsonBody, Encoding.UTF8, "application/json");
        }

        return request;
    }

    public static void MapClassicRetrievalEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/classic")
            .WithTags("Classic Retrieval");

        group.MapPost("/indexes/{indexName}/documents/search", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexName,
                [FromBody] JsonElement requestBody,
                [FromQuery] string? apiVersion,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var version = string.IsNullOrWhiteSpace(apiVersion) ? DefaultApiVersion : apiVersion;
                var http = httpClientFactory.CreateClient();

                var rawBody = requestBody.ValueKind == JsonValueKind.Undefined ? null : requestBody.GetRawText();
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Post,
                    $"indexes/{Uri.EscapeDataString(indexName)}/docs/search?api-version={Uri.EscapeDataString(version)}",
                    cancellationToken,
                    rawJsonBody: rawBody);

                var response = await http.SendAsync(request, cancellationToken);
                var text = await response.Content.ReadAsStringAsync(cancellationToken);
                var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/json";

                return Results.Content(text, contentType: contentType, statusCode: (int)response.StatusCode);
            })
            .WithSummary("Run classic /docs/search")
            .WithDescription("Forwards a raw Azure AI Search /docs/search request body to the service and returns the raw JSON response.")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/indexes/{indexName}/documents/index", async (
                [FromQuery] string connectionId,
                [FromRoute] string indexName,
                [FromBody] JsonElement requestBody,
                [FromQuery] string? apiVersion,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var version = string.IsNullOrWhiteSpace(apiVersion) ? DefaultApiVersion : apiVersion;
                var http = httpClientFactory.CreateClient();

                var rawBody = requestBody.ValueKind == JsonValueKind.Undefined ? null : requestBody.GetRawText();
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Post,
                    $"indexes/{Uri.EscapeDataString(indexName)}/docs/search.index?api-version={Uri.EscapeDataString(version)}",
                    cancellationToken,
                    rawJsonBody: rawBody);

                var response = await http.SendAsync(request, cancellationToken);
                var text = await response.Content.ReadAsStringAsync(cancellationToken);
                var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/json";

                return Results.Content(text, contentType: contentType, statusCode: (int)response.StatusCode);
            })
            .WithSummary("Index documents")
            .WithDescription("Forwards a raw Azure AI Search /docs/search.index request body to index, merge, or delete documents.")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status202Accepted)
            .Produces(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces(StatusCodes.Status404NotFound);
    }
}
