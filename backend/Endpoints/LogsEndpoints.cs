using AzureAISearchExplorer.Backend.Infrastructure.Logging;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

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
