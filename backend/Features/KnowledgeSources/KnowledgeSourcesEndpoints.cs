using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AzureAISearchExplorer.Backend.Features.KnowledgeSources;

public static class KnowledgeSourcesEndpoints
{
    // Not currently available in the Azure.Search.Documents SDK version used by this repo.
    // Use the Search REST API instead.
    private const string ApiVersion = "2025-11-01-preview";

    private sealed record SearchListResponse<T>(IReadOnlyList<T> Value);

    private sealed record KnowledgeSourceDto
    {
        public string Name { get; init; } = string.Empty;
        public string? Kind { get; init; }
        public string? Description { get; init; }

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

    public static void MapKnowledgeSourcesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/knowledgesources")
            .WithTags("Knowledge Sources");

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
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Get, $"knowledgeSources?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsed = JsonSerializer.Deserialize<SearchListResponse<KnowledgeSourceDto>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Results.Ok(parsed?.Value ?? Array.Empty<KnowledgeSourceDto>());
            })
            .WithSummary("List knowledge sources")
            .WithDescription("Lists all knowledge sources configured in the Azure AI Search service for the given connection.")
            .Produces<IEnumerable<KnowledgeSourceDto>>(StatusCodes.Status200OK);

        group.MapGet("/{knowledgeSourceName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string knowledgeSourceName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Get, $"knowledgeSources/{Uri.EscapeDataString(knowledgeSourceName)}?api-version={ApiVersion}", cancellationToken);
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
            .WithSummary("Get knowledge source")
            .WithDescription("Gets a knowledge source definition by name.")
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
                [FromQuery] string connectionId,
                [FromBody] JsonElement knowledgeSource,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var name = knowledgeSource.TryGetProperty("name", out var n) ? (n.GetString() ?? string.Empty).Trim() : string.Empty;
                if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest("Knowledge source name is required.");

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Put,
                    $"knowledgeSources/{Uri.EscapeDataString(name)}?api-version={ApiVersion}",
                    cancellationToken,
                    jsonBody: knowledgeSource);

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
            .WithSummary("Create or update knowledge source")
            .WithDescription("Creates a new knowledge source or updates an existing one.")
            .Produces(StatusCodes.Status200OK);

        group.MapDelete("/{knowledgeSourceName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string knowledgeSourceName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Delete, $"knowledgeSources/{Uri.EscapeDataString(knowledgeSourceName)}?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return Results.NotFound();
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                return Results.NoContent();
            })
            .WithSummary("Delete knowledge source")
            .WithDescription("Deletes a knowledge source by name.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
