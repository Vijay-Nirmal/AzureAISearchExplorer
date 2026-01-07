using AzureAISearchExplorer.Backend.Shared.Models;

namespace AzureAISearchExplorer.Backend.Shared.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
	Task<IEnumerable<T>> GetAllAsync();
	Task<T?> GetByIdAsync(string id);
	Task AddAsync(T entity);
	Task UpdateAsync(T entity);
	Task DeleteAsync(string id);
}
