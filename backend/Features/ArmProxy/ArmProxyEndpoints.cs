using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using System.Text;
using System.Text.Json;

namespace AzureAISearchExplorer.Backend.Features.ArmProxy;

public static class ArmProxyEndpoints
{
	private const string DefaultArmApiVersion = "2023-11-01";

	public static void MapArmProxyEndpoints(this IEndpointRouteBuilder app)
	{
		var group = app.MapGroup("/api/arm")
			.WithTags("ARM Proxy");

		group.MapMethods("/{**path}", new[] { "GET", "POST", "PUT", "PATCH", "DELETE" }, async (
				HttpContext context,
				[FromRoute] string? path,
				[FromQuery] string? connectionId,
				IRepository<ConnectionProfile> repository,
				AuthenticationService auth,
				IHttpClientFactory httpClientFactory,
				CancellationToken cancellationToken) =>
			{
				ConnectionProfile? profile = null;
				if (context.Request.Headers.TryGetValue("X-Connection-Profile", out var rawProfile))
				{
					try
					{
						var json = Encoding.UTF8.GetString(Convert.FromBase64String(rawProfile.ToString()));
						profile = JsonSerializer.Deserialize<ConnectionProfile>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web));
					}
					catch
					{
						return Results.BadRequest("Invalid connection profile header.");
					}
				}

				if (profile == null && !string.IsNullOrWhiteSpace(connectionId))
				{
					profile = await repository.GetByIdAsync(connectionId);
				}

				if (profile == null) return Results.NotFound();

				var header = await auth.GetArmAuthHeaderAsync(profile, cancellationToken);
				if (header is null) return Results.BadRequest("ARM authentication is not available for this connection.");

				var query = QueryHelpers.ParseQuery(context.Request.QueryString.Value ?? string.Empty);
				var filtered = new Dictionary<string, string?>();
				foreach (var (key, value) in query)
				{
					if (string.Equals(key, "connectionId", StringComparison.OrdinalIgnoreCase))
					{
						continue;
					}

					if (value.Count == 0) continue;
					filtered[key] = value.ToString();
				}

				if (!filtered.ContainsKey("api-version"))
				{
					filtered["api-version"] = DefaultArmApiVersion;
				}

				var queryString = QueryHelpers.AddQueryString(string.Empty, filtered).TrimStart('?');
				var cleanPath = string.IsNullOrWhiteSpace(path) ? string.Empty : path.TrimStart('/');
				var relative = string.IsNullOrWhiteSpace(queryString)
					? cleanPath
					: string.IsNullOrWhiteSpace(cleanPath) ? $"?{queryString}" : $"{cleanPath}?{queryString}";

				string? rawBody = null;
				if (context.Request.ContentLength > 0)
				{
					using var reader = new StreamReader(context.Request.Body, Encoding.UTF8);
					rawBody = await reader.ReadToEndAsync(cancellationToken);
				}

				var http = httpClientFactory.CreateClient();
				var request = new HttpRequestMessage(new HttpMethod(context.Request.Method), new Uri($"https://management.azure.com/{relative.TrimStart('/')}"));
				request.Headers.TryAddWithoutValidation(header.Value.Name, header.Value.Value);

				if (!string.IsNullOrWhiteSpace(rawBody))
				{
					request.Content = new StringContent(rawBody, Encoding.UTF8, "application/json");
				}

				using var response = await http.SendAsync(request, cancellationToken);
				var text = await response.Content.ReadAsStringAsync(cancellationToken);
				var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/json";

				return Results.Content(text, contentType: contentType, statusCode: (int)response.StatusCode);
			})
			.WithSummary("Proxy Azure Resource Manager REST")
			.WithDescription("Proxies Azure Resource Manager REST calls through the backend to avoid browser CORS and apply ARM auth.")
			.Produces(StatusCodes.Status200OK)
			.Produces(StatusCodes.Status400BadRequest)
			.Produces(StatusCodes.Status401Unauthorized)
			.Produces(StatusCodes.Status403Forbidden)
			.Produces(StatusCodes.Status404NotFound);
	}
}
