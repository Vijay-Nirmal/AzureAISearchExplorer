using Azure.Search.Documents.Indexes.Models;

namespace AzureAISearchExplorer.Backend.Shared.Models;

public class ServiceFullOverview
{
	public SearchServiceStatistics? Stats { get; set; }
	public string Endpoint { get; set; } = string.Empty;
	public string Name { get; set; } = string.Empty;

	// Management Plane Details
	public string? Location { get; set; }
	public string? Sku { get; set; }
	public int? ReplicaCount { get; set; }
	public int? PartitionCount { get; set; }
	public string? Status { get; set; }
	public string? HostingMode { get; set; }
	public string? PublicNetworkAccess { get; set; }
	public IDictionary<string, string>? Tags { get; set; }
	public bool IsManagementAvailable { get; set; }
	public string? ResourceId { get; set; }

	// Extended Details
	public string? NetworkRuleSet { get; set; }
	public bool? DisableLocalAuth { get; set; }
	public string? AuthOptions { get; set; }
	public string? EncryptionWithCmk { get; set; }
	public IEnumerable<string>? PrivateEndpointConnections { get; set; }
	public IEnumerable<string>? SharedPrivateLinkResources { get; set; }
	public string? SystemDataCreatedAt { get; set; }
	public string? SystemDataCreatedBy { get; set; }
	public string? SystemDataLastModifiedAt { get; set; }
	public string? SystemDataLastModifiedBy { get; set; }
	public string? ProvisioningState { get; set; }
	public string? SemanticSearch { get; set; }
}
