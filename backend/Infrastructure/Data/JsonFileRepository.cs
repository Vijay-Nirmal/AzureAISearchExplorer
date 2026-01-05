using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AzureAISearchExplorer.Backend.Shared.Interfaces;
using AzureAISearchExplorer.Backend.Shared.Models;

namespace AzureAISearchExplorer.Backend.Infrastructure.Data;

public class JsonFileRepository<T> : IRepository<T> where T : BaseEntity
{
    private readonly string _filePath;
    private readonly JsonSerializerOptions _jsonOptions;

    public JsonFileRepository(IWebHostEnvironment env)
    {
        var dataDir = Path.Combine(env.ContentRootPath, "Data");
        if (!Directory.Exists(dataDir))
        {
            Directory.CreateDirectory(dataDir);
        }

        var fileName = typeof(T).Name + ".json";
        _filePath = Path.Combine(dataDir, fileName);
        
        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };
    }

    private async Task<List<T>> ReadFileAsync()
    {
        if (!File.Exists(_filePath))
        {
            return new List<T>();
        }

        try
        {
            using var stream = File.OpenRead(_filePath);
            return await JsonSerializer.DeserializeAsync<List<T>>(stream, _jsonOptions) ?? new List<T>();
        }
        catch (JsonException)
        {
            // Handle corrupted file or empty file
            return new List<T>();
        }
    }

    private async Task WriteFileAsync(List<T> items)
    {
        using var stream = File.Create(_filePath);
        await JsonSerializer.SerializeAsync(stream, items, _jsonOptions);
    }

    /// <summary>
    /// Retrieves all entities from the JSON file.
    /// </summary>
    /// <returns>A collection of entities.</returns>
    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await ReadFileAsync();
    }

    /// <summary>
    /// Retrieves a specific entity by its ID.
    /// </summary>
    /// <param name="id">The ID of the entity.</param>
    /// <returns>The entity if found, otherwise null.</returns>
    public async Task<T?> GetByIdAsync(string id)
    {
        var items = await ReadFileAsync();
        return items.FirstOrDefault(x => x.Id == id);
    }

    /// <summary>
    /// Adds a new entity to the JSON file.
    /// </summary>
    /// <param name="entity">The entity to add.</param>
    public async Task AddAsync(T entity)
    {
        var items = await ReadFileAsync();
        items.Add(entity);
        await WriteFileAsync(items);
    }

    /// <summary>
    /// Updates an existing entity in the JSON file.
    /// </summary>
    /// <param name="entity">The entity with updated values.</param>
    public async Task UpdateAsync(T entity)
    {
        var items = await ReadFileAsync();
        var index = items.FindIndex(x => x.Id == entity.Id);
        if (index != -1)
        {
            items[index] = entity;
            await WriteFileAsync(items);
        }
    }

    /// <summary>
    /// Deletes an entity from the JSON file by its ID.
    /// </summary>
    /// <param name="id">The ID of the entity to delete.</param>
    public async Task DeleteAsync(string id)
    {
        var items = await ReadFileAsync();
        var itemToRemove = items.FirstOrDefault(x => x.Id == id);
        if (itemToRemove != null)
        {
            items.Remove(itemToRemove);
            await WriteFileAsync(items);
        }
    }
}
