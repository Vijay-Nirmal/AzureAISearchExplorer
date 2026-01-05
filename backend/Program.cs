using AzureAISearchExplorer.Backend.Endpoints;
using AzureAISearchExplorer.Backend.Extensions;

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

app.Run();
