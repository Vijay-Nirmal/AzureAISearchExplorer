using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Infrastructure.Logging;

public class LogBufferService
{
    private readonly List<LogEntry> _logs = new();
    private readonly object _lock = new();
    private const int MaxLogs = 1000; // Keep last 1000 logs

    private LogLevel _minLogLevel = LogLevel.Information;
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

    public IEnumerable<LogEntry> GetLogs()
    {
        lock (_lock)
        {
            return _logs.ToArray();
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _logs.Clear();
        }
    }
}
