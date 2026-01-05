using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace AzureAISearchExplorer.Backend.Infrastructure.Logging;

public class LogBufferService
{
    private readonly ConcurrentQueue<LogEntry> _logs = new();
    private const int MaxLogs = 1000; // Keep last 1000 logs

    public void AddLog(LogEntry entry)
    {
        _logs.Enqueue(entry);
        
        // Trim if needed
        while (_logs.Count > MaxLogs)
        {
            _logs.TryDequeue(out _);
        }
    }

    public IEnumerable<LogEntry> GetLogs()
    {
        return _logs.ToArray();
    }
    
    public void Clear()
    {
        _logs.Clear();
    }
}
