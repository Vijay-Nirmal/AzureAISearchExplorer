using AzureAISearchExplorer.Backend.Infrastructure.Data;
using AzureAISearchExplorer.Backend.Infrastructure.Logging;
using AzureAISearchExplorer.Backend.Infrastructure.Middleware;
using AzureAISearchExplorer.Backend.Infrastructure.Services;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Extensions;

public static class InfrastructureExtensions
{
    /// <summary>
    /// Registers infrastructure services (Data Access, Logging, Middleware, etc.) into the dependency injection container.
    /// </summary>
    /// <param name="services">The service collection.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // OpenAPI
        services.AddOpenApi();

        // Exception Handling
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddProblemDetails();

        // CORS
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            });
        });

        // Data Access
        services.AddScoped(typeof(IRepository<>), typeof(JsonFileRepository<>));

        // Services
        services.AddScoped<AzureResourceResolver>();
        services.AddSingleton<AuthenticationService>();
        services.AddScoped<SearchClientFactory>();

        // Logging
        services.AddSingleton<LogBufferService>();
        
        return services;
    }

    /// <summary>
    /// Configures the logging pipeline to use the custom BufferedLogger.
    /// </summary>
    /// <param name="logging">The logging builder.</param>
    /// <param name="services">The service collection.</param>
    public static void AddBufferedLogging(this ILoggingBuilder logging, IServiceCollection services)
    {
        logging.ClearProviders();
        logging.AddConsole();
        logging.AddDebug();
        services.AddSingleton<ILoggerProvider, BufferedLoggerProvider>();
    }
}
