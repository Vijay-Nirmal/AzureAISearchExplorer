namespace AzureAISearchExplorer.Backend.Infrastructure.Logging;

public class LogEntry
{
	public DateTime Timestamp { get; set; }
	public string Level { get; set; } = string.Empty;
	public string Category { get; set; } = string.Empty;
	public string Message { get; set; } = string.Empty;
	public string? Exception { get; set; }
}
