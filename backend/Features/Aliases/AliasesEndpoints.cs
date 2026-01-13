using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace AzureAISearchExplorer.Backend.Features.Aliases;

public static class AliasesEndpoints
{
    // Aliases are not exposed in the current Azure.Search.Documents SDK version in this repo.
    // Use the Search REST API instead.
    // Use a version that supports alias operations.
    private const string ApiVersion = "2025-11-01-preview";

    private sealed record SearchListResponse<T>(IReadOnlyList<T> Value);

    private sealed record SearchAliasDto(
        string Name,
        IReadOnlyList<string> Indexes,
        [property: System.Text.Json.Serialization.JsonPropertyName("@odata.etag")] string? ETag);

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

    public static void MapAliasesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/aliases")
            .WithTags("Aliases");

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
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Get, $"aliases?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsed = JsonSerializer.Deserialize<SearchListResponse<SearchAliasDto>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Results.Ok(parsed?.Value ?? Array.Empty<SearchAliasDto>());
            })
            .WithSummary("List aliases")
            .WithDescription("Lists all index aliases configured in the Azure AI Search service for the given connection.")
            .Produces<IEnumerable<SearchAliasDto>>(StatusCodes.Status200OK);

        group.MapGet("/{aliasName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string aliasName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Get, $"aliases/{Uri.EscapeDataString(aliasName)}?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return Results.NotFound();
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsed = JsonSerializer.Deserialize<SearchAliasDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return parsed == null ? Results.NotFound() : Results.Ok(parsed);
            })
            .WithSummary("Get alias")
            .WithDescription("Gets an alias definition by name.")
            .Produces<SearchAliasDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
                [FromQuery] string connectionId,
                [FromBody] SearchAliasDto alias,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var name = (alias.Name ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(name)) return Results.BadRequest("Alias name is required.");

                var http = httpClientFactory.CreateClient();
                // REST uses PUT to create/update by name.
                var request = await CreateSearchRestRequestAsync(
                    profile,
                    auth,
                    HttpMethod.Put,
                    $"aliases/{Uri.EscapeDataString(name)}?api-version={ApiVersion}",
                    cancellationToken,
                    jsonBody: new { name, indexes = alias.Indexes });

                var response = await http.SendAsync(request, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                var json = await response.Content.ReadAsStringAsync(cancellationToken);
                var parsed = JsonSerializer.Deserialize<SearchAliasDto>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Results.Ok(parsed ?? alias);
            })
            .WithSummary("Create or update alias")
            .WithDescription("Creates a new alias or updates an existing alias.")
            .Produces<SearchAliasDto>(StatusCodes.Status200OK);

        group.MapDelete("/{aliasName}", async (
                [FromQuery] string connectionId,
                [FromRoute] string aliasName,
                IRepository<ConnectionProfile> repository,
                AuthenticationService auth,
                IHttpClientFactory httpClientFactory,
                CancellationToken cancellationToken) =>
            {
                var profile = await repository.GetByIdAsync(connectionId);
                if (profile == null) return Results.NotFound();

                var http = httpClientFactory.CreateClient();
                var request = await CreateSearchRestRequestAsync(profile, auth, HttpMethod.Delete, $"aliases/{Uri.EscapeDataString(aliasName)}?api-version={ApiVersion}", cancellationToken);
                var response = await http.SendAsync(request, cancellationToken);

                if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return Results.NotFound();
                if (!response.IsSuccessStatusCode)
                {
                    var text = await response.Content.ReadAsStringAsync(cancellationToken);
                    return Results.Problem(text, statusCode: (int)response.StatusCode);
                }

                return Results.NoContent();
            })
            .WithSummary("Delete alias")
            .WithDescription("Deletes an alias by name.")
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
