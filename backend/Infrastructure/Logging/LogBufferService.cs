namespace AzureAISearchExplorer.Backend.Infrastructure.Logging;

public class LogBufferService
{
	private readonly List<LogEntry> _logs = new();
	private readonly object _lock = new();
	private const int MaxLogs = 1000; // Keep last 1000 logs

	private LogLevel _minLogLevel = LogLevel.Information;

	/// <summary>
	/// Gets or sets the minimum log level. Logs below this level will be filtered out.
	/// Setting this property will also remove existing logs that are below the new level.
	/// </summary>
	public LogLevel MinLogLevel
	{
		get => _minLogLevel;
		set
		{
			lock (_lock)
			{
				_minLogLevel = value;
				// Remove logs that are below the new minimum level
				_logs.RemoveAll(l => Enum.TryParse<LogLevel>(l.Level, out var level) && level < _minLogLevel);
			}
		}
	}

	/// <summary>
	/// Adds a new log entry to the buffer.
	/// Trims the buffer if it exceeds the maximum capacity.
	/// </summary>
	/// <param name="entry">The log entry to add.</param>
	public void AddLog(LogEntry entry)
	{
		lock (_lock)
		{
			_logs.Add(entry);

			// Trim if needed
			if (_logs.Count > MaxLogs)
			{
				_logs.RemoveAt(0);
			}
		}
	}

	/// <summary>
	/// Retrieves a copy of the current logs in the buffer.
	/// </summary>
	/// <returns>An enumerable of log entries.</returns>
	public IEnumerable<LogEntry> GetLogs()
	{
		lock (_lock)
		{
			return _logs.ToArray();
		}
	}

	/// <summary>
	/// Clears all logs from the buffer.
	/// </summary>
	public void Clear()
	{
		lock (_lock)
		{
			_logs.Clear();
		}
	}
}
