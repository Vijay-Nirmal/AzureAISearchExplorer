using AzureAISearchExplorer.Backend.Endpoints;
using AzureAISearchExplorer.Backend.Extensions;
using AzureAISearchExplorer.Backend.Features.Connections;
using AzureAISearchExplorer.Backend.Features.Indexes;
using AzureAISearchExplorer.Backend.Features.Service;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddInfrastructureServices();
builder.Logging.AddBufferedLogging(builder.Services);

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

// Map Endpoints
app.MapLogsEndpoints();
app.MapConnectionsEndpoints();
app.MapServiceEndpoints();
app.MapIndexesEndpoints();

app.Run();
