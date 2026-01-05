using AzureAISearchExplorer.Backend.Infrastructure.Logging;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Endpoints;

public static class LogsEndpoints
{
    public static void MapLogsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/logs")
            .WithTags("Logs");

        group.MapGet("/", (LogBufferService logService) =>
        {
            return logService.GetLogs();
        })
        .WithName("GetLogs")
        .WithSummary("Retrieves buffered logs")
        .WithDescription("Returns a list of the most recent logs captured by the in-memory buffer.")
        .Produces<IEnumerable<LogEntry>>(StatusCodes.Status200OK);

        group.MapPost("/configuration", (LogBufferService logService, [FromBody] LogLevelConfig config) =>
        {
            if (Enum.TryParse<LogLevel>(config.Level, true, out var level))
            {
                logService.MinLogLevel = level;
                return Results.Ok();
            }
            return Results.BadRequest("Invalid log level.");
        })
        .WithName("SetLogLevel")
        .WithSummary("Sets the minimum log level")
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest);

        group.MapDelete("/", (LogBufferService logService) =>
        {
            logService.Clear();
            return Results.Ok();
        })
        .WithName("ClearLogs")
        .WithSummary("Clears buffered logs")
        .WithDescription("Clears all logs currently stored in the in-memory buffer.")
        .Produces(StatusCodes.Status200OK);
    }
}

public record LogLevelConfig(string Level);
