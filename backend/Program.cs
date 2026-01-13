using AzureAISearchExplorer.Backend.Endpoints;
using AzureAISearchExplorer.Backend.Extensions;
using AzureAISearchExplorer.Backend.Features.Connections;
using AzureAISearchExplorer.Backend.Features.DataSources;
using AzureAISearchExplorer.Backend.Features.Indexers;
using AzureAISearchExplorer.Backend.Features.Indexes;
using AzureAISearchExplorer.Backend.Features.Aliases;
using AzureAISearchExplorer.Backend.Features.SynonymMaps;
using AzureAISearchExplorer.Backend.Features.Skillsets;
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
app.MapConnectionsEndpoints();
app.MapServiceEndpoints();
app.MapIndexesEndpoints();
app.MapAliasesEndpoints();
app.MapSynonymMapsEndpoints();
app.MapDataSourcesEndpoints();
app.MapSkillsetsEndpoints();
app.MapIndexersEndpoints();

app.Run();
