using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AzureAISearchExplorer.Backend.Features.KnowledgeBases;

public static class KnowledgeBasesEndpoints
{
    // Not currently available in the Azure.Search.Documents SDK version used by this repo.
    // Use the Search REST API instead.
    private const string ApiVersion = "2025-11-01-preview";

    private sealed record SearchListResponse<T>(IReadOnlyList<T> Value);

    private sealed record KnowledgeBaseDto
    {
        public string Name { get; init; } = string.Empty;
        public string? Description { get; init; }
        public string? OutputMode { get; init; }

        [JsonPropertyName("@odata.etag")]
        public string? ETag { get; init; }

        [JsonExtensionData]
        public Dictionary<string, JsonElement>? Additional { get; init; }
    }

    private static async Task<HttpRequestMessage> CreateSearchRestRequestAsync(
        ConnectionProfile profile,
        AuthenticationService auth,
        HttpMethod method,
        string relativePathAndQuery,
        CancellationToken cancellationToken,
        object? jsonBody = null)
    {
        var endpoint = profile.Endpoint.TrimEnd('/');
        var url = new Uri($"{endpoint}/{relativePathAndQuery.TrimStart('/')}");

        var request = new HttpRequestMessage(method, url);

        await auth.TryApplySearchAuthHeaderAsync(request.Headers, profile, cancellationToken);

        if (jsonBody != null)
        {
            var json = JsonSerializer.Serialize(jsonBody);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        return request;
    }

    public static void MapKnowledgeBasesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/knowledgebases")
            .WithTags("Knowledge Bases");

        group.MapGet("/", async (
                [FromQuery] string connectionId,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Get, $"knowledgeBases?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsed = JsonSerializer.Deserialize<SearchListResponse<KnowledgeBaseDto>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Results.Ok(parsed?.Value ?? Array.Empty<KnowledgeBaseDto>());
            })
            .WithSummary("List knowledge bases")
            .WithDescription("Lists all knowledge bases configured in the Azure AI Search service for the given connection.")
            .Produces<IEnumerable<KnowledgeBaseDto>>(StatusCodes.Status200OK);

        group.MapGet("/{knowledgeBaseName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string knowledgeBaseName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Get, $"knowledgeBases/{Uri.EscapeDataString(knowledgeBaseName)}?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return Results.NotFound();
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);
                return Results.Ok(doc.RootElement.Clone());
            })
            .WithSummary("Get knowledge base")
            .WithDescription("Gets a knowledge base definition by name.")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
                [FromQuery] string connectionId,
                [FromBody] JsonElement knowledgeBase,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var name = knowledgeBase.TryGetProperty("name", out var n) ? (n.GetString() ?? string.Empty).Trim() : string.Empty;
                if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest("Knowledge base name is required.");

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Put,
                    $"knowledgeBases/{Uri.EscapeDataString(name)}?api-version={ApiVersion}",
                    cancellationToken,
                    jsonBody: knowledgeBase);

                var response = await http.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                using var doc = JsonDocument.Parse(json);
                return Results.Ok(doc.RootElement.Clone());
            })
            .WithSummary("Create or update knowledge base")
            .WithDescription("Creates a new knowledge base or updates an existing one.")
            .Produces(StatusCodes.Status200OK);

        group.MapDelete("/{knowledgeBaseName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string knowledgeBaseName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Delete, $"knowledgeBases/{Uri.EscapeDataString(knowledgeBaseName)}?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return Results.NotFound();
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                return Results.NoContent();
            })
            .WithSummary("Delete knowledge base")
            .WithDescription("Deletes a knowledge base by name.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/{knowledgeBaseName}/retrieve", async (
                [FromQuery] string connectionId,
                [FromRoute] string knowledgeBaseName,
                [FromBody] JsonElement retrieveRequest,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Post,
                    $"knowledgebases/{Uri.EscapeDataString(knowledgeBaseName)}/retrieve?api-version={ApiVersion}",
                    cancellationToken,
                    jsonBody: retrieveRequest);

                var response = await http.SendAsync(request, cancellationToken);

                var json = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    return Results.Problem(json, statusCode: (int)response.StatusCode);
                }

                // Preserve partial content semantics (206) if the service returns it.
                return Results.Content(json, "application/json", statusCode: (int)response.StatusCode);
            })
            .WithSummary("Retrieve using knowledge base")
            .WithDescription("Runs the agentic retrieval pipeline for the specified knowledge base and returns response/activity/references.")
            .Produces(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status206PartialContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
