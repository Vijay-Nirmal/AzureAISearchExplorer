using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Infrastructure.Logging;

public class BufferedLoggerProvider : ILoggerProvider
{
    private readonly LogBufferService _logBuffer;
    private readonly ConcurrentDictionary<string, BufferedLogger> _loggers = new();

    public BufferedLoggerProvider(LogBufferService logBuffer)
    {
        _logBuffer = logBuffer;
    }

    public ILogger CreateLogger(string categoryName)
    {
        return _loggers.GetOrAdd(categoryName, name => new BufferedLogger(name, _logBuffer));
    }

    public void Dispose()
    {
        _loggers.Clear();
    }
}
