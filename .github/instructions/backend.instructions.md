---
name: Backend Instructions
description: This file provides instructions and guidelines for backend development using ASP.NET Core.
applyTo: "backend/**"
---
# Backend Development Instructions

## Tech Stack
- **Framework**: ASP.NET Core 10.0 (Web API)
- **Database**: JSON Files (Abstracted via Repository Pattern)
- **Logging**: Native `ILogger` with custom In-Memory Buffer

## Design Philosophy
- **Architecture**: Modular Monolith / Clean Architecture principles.
- **Dependency Injection**: Use Constructor Injection for all dependencies.
- **Statelessness**: Keep the core logic stateless. State is managed via the Repository or specific Singleton services (like Logging).
- **Abstraction**: Always code to interfaces (`IRepository<T>`, `ILogger`, etc.) to allow future swapping of implementations (e.g., moving from JSON to SQLite).

## Project Structure
- `Endpoints/`: Contains Minimal API endpoint definitions, grouped by feature (e.g., `LogsEndpoints.cs`).
- `Extensions/`: Contains `IServiceCollection` extensions for dependency injection (e.g., `InfrastructureExtensions.cs`).
- `Features/`: Contains functional modules. Each feature should have its own folder (e.g., `Features/Indexes/`, `Features/Search/`).
- `Shared/`: Shared code used across multiple features.
  - `Shared/Interfaces/`: Common interfaces (e.g., `IRepository<T>`).
  - `Shared/Models/`: Common data models (e.g., `BaseEntity`).
- `Infrastructure/`: Implementation details for interfaces.
  - `Infrastructure/Data/`: Database implementation (`JsonFileRepository`).
  - `Infrastructure/Logging/`: Custom logging implementation (`BufferedLogger`).

## Data Access
- **Repository Pattern**: Use `IRepository<T>` for all data access.
- **Implementation**: Currently uses `JsonFileRepository<T>` which stores data as JSON files in the `Data/` directory.
- **Usage**: Inject `IRepository<MyEntity>` into your services/controllers.

## Logging
- **Standard Usage**: Use `ILogger<T>` in your classes.
- **Buffering**: Logs are automatically intercepted by `BufferedLogger` and stored in `LogBufferService`.

## Coding Guidelines
- **Endpoints**: Use Minimal APIs in `Endpoints/` folder. Group related endpoints into static classes with extension methods on `IEndpointRouteBuilder`.
  - **Documentation**: Always use `.WithSummary()`, `.WithDescription()`, and `.Produces<T>()` for all endpoints to ensure proper OpenAPI documentation.
- **Dependency Injection**: Use `Extensions/` to keep `Program.cs` clean. Create extension methods on `IServiceCollection` for feature-specific registrations.
- **Async/Await**: Use asynchronous programming for all I/O bound operations.
- **Controllers**: Avoid Controllers if possible, prefer Minimal APIs.
- **Error Handling**: Use global exception handling via `IExceptionHandler`.
  - All unhandled exceptions are logged and returned as `ProblemDetails` (RFC 7807).
  - Do not catch generic exceptions in endpoints unless you can handle them gracefully; let them bubble up to the global handler.
- **API Design**: Follow RESTful conventions.
- **OpenAPI**: Ensure all endpoints are properly detailed documented with WithSummary(), WithDescription(), etc for OpenAPI generation.
- **Try Catch**: Try-catch is NOT needed in API endpoints unless you are handling specific exceptions. The global exception handler will take care of unexpected errors.

## Running the App
- **Command**:
  - `dotnet run` (inside `backend/` directory)
  - `npm run start:backend` (inside root directory)
