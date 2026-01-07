namespace AzureAISearchExplorer.Backend.Shared.Models;

public class ConnectionProfile : BaseEntity
{
	public string Name { get; set; } = string.Empty;
	public string Endpoint { get; set; } = string.Empty;
	public string AuthType { get; set; } = "AzureAD"; // AzureAD, ApiKey, ManagedIdentity
	public string? ApiKey { get; set; }
	public string? TenantId { get; set; }
	public string? ClientId { get; set; }
	public string? ManagedIdentityType { get; set; } // System, User
	public string? Group { get; set; }

	// Management Plane Details (Resolved on Save)
	public string? ResourceId { get; set; }
	public bool? HasManagementAccess { get; set; }
	public string? SubscriptionId { get; set; }
	public string? ResourceGroupName { get; set; }
}
