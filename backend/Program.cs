using AzureAISearchExplorer.Backend.Endpoints;
using AzureAISearchExplorer.Backend.Extensions;
using AzureAISearchExplorer.Backend.Features.ArmProxy;
using AzureAISearchExplorer.Backend.Features.SearchProxy;
using AzureAISearchExplorer.Backend.Features.Service;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Azure;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<JsonOptions>(options =>
{
	options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddInfrastructureServices();
builder.Logging.AddBufferedLogging(builder.Services);

var app = builder.Build();

// Configure the HTTP request pipeline.
app.Services.GetRequiredService<AzureEventSourceLogForwarder>().Start();
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
}

app.UseCors();

// Map Endpoints
app.MapLogsEndpoints();
app.MapServiceEndpoints();
app.MapSearchProxyEndpoints();
app.MapArmProxyEndpoints();

app.Run();
