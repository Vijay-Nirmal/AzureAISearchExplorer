using System;
using Microsoft.Extensions.Logging;

namespace AzureAISearchExplorer.Backend.Infrastructure.Logging;

public class BufferedLogger : ILogger
{
    private readonly string _categoryName;
    private readonly LogBufferService _logBuffer;

    public BufferedLogger(string categoryName, LogBufferService logBuffer)
    {
        _categoryName = categoryName;
        _logBuffer = logBuffer;
    }

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => default!;

    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel))
        {
            return;
        }

        var entry = new LogEntry
        {
            Timestamp = DateTime.UtcNow,
            Level = logLevel.ToString(),
            Category = _categoryName,
            Message = formatter(state, exception),
            Exception = exception?.ToString()
        };

        _logBuffer.AddLog(entry);
    }
}
