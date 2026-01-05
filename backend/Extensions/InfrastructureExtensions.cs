using AzureAISearchExplorer.Backend.Infrastructure.Data;
using AzureAISearchExplorer.Backend.Infrastructure.Logging;
using AzureAISearchExplorer.Backend.Infrastructure.Middleware;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Extensions;

public static class InfrastructureExtensions
{
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

        // Logging
        services.AddSingleton<LogBufferService>();
        
        return services;
    }

    public static void AddBufferedLogging(this ILoggingBuilder logging, IServiceCollection services)
    {
        logging.ClearProviders();
        logging.AddConsole();
        logging.AddDebug();
        services.AddSingleton<ILoggerProvider, BufferedLoggerProvider>();
    }
}
