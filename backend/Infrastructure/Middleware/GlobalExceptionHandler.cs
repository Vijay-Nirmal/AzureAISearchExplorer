using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AzureAISearchExplorer.Backend.Infrastructure.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
	private readonly ILogger<GlobalExceptionHandler> _logger;

	public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
	{
		_logger = logger;
	}

	public async ValueTask<bool> TryHandleAsync(
		HttpContext httpContext,
		Exception exception,
		CancellationToken cancellationToken)
	{
		_logger.LogError(
			exception, "An unhandled exception has occurred: {Message}", exception.Message);

		var problemDetails = new ProblemDetails
		{
			Status = StatusCodes.Status500InternalServerError,
			Title = "An error occurred while processing your request.",
			Detail = exception.Message,
			Instance = httpContext.Request.Path
		};

		problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;
		problemDetails.Extensions["stackTrace"] = exception.StackTrace;
		if (exception.InnerException != null)
		{
			problemDetails.Extensions["innerException"] = exception.InnerException.Message;
		}

		httpContext.Response.StatusCode = problemDetails.Status.Value;

		await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

		return true;
	}
}
