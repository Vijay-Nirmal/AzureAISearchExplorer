[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$InputPath = "$PSScriptRoot\Azure AI Seach TOC from Offical Docs.json",

    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "$PSScriptRoot\Azure-AI-Search-TOC.md",

    # Base for relative hrefs like "search-what-is-azure-search" or "./"
    [Parameter(Mandatory = $false)]
    [string]$BaseUrl = "https://learn.microsoft.com/en-us/azure/search/"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Try-GetPropValue {
    param(
        [Parameter(Mandatory)]
        $Object,

        [Parameter(Mandatory)]
        [string]$Name
    )

    $prop = $Object.PSObject.Properties[$Name]
    if ($null -ne $prop) {
        return $prop.Value
    }
    return $null
}

function Get-NodeTitle {
    param([Parameter(Mandatory)]$Node)

    $tocTitle = Try-GetPropValue -Object $Node -Name 'toc_title'
    if ($null -ne $tocTitle -and ("$tocTitle".Trim() -ne '')) {
        return [string]$tocTitle
    }

    $displayName = Try-GetPropValue -Object $Node -Name 'displayName'
    if ($null -ne $displayName -and ("$displayName".Trim() -ne '')) {
        return [string]$displayName
    }

    $title = Try-GetPropValue -Object $Node -Name 'title'
    if ($null -ne $title -and ("$title".Trim() -ne '')) {
        return [string]$title
    }
    return "(untitled)"
}

function Resolve-FullUrl {
    param(
        [Parameter(Mandatory = $false)]
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Href,

        [Parameter(Mandatory)]
        [string]$BaseUrl
    )

    if ([string]::IsNullOrWhiteSpace($Href)) {
        return $null
    }

    $hrefTrimmed = $Href.Trim()

    # Already absolute
    if ($hrefTrimmed -match '^(?i)https?://') {
        return $hrefTrimmed
    }

    # Site absolute (learn.microsoft.com)
    if ($hrefTrimmed.StartsWith('/')) {
        return "https://learn.microsoft.com$hrefTrimmed"
    }

    # Normalize base to end with '/'
    $normalizedBase = $BaseUrl
    if (-not $normalizedBase.EndsWith('/')) {
        $normalizedBase += '/'
    }

    # Use System.Uri to resolve ./, ../, and querystrings correctly
    $baseUri = [System.Uri]::new($normalizedBase)
    $resolved = [System.Uri]::new($baseUri, $hrefTrimmed)
    return $resolved.AbsoluteUri
}

function Write-MarkdownToc {
    param(
        [Parameter(Mandatory)]
        $Nodes,

        [Parameter(Mandatory)]
        [int]$Depth,

        [Parameter(Mandatory)]
        [string]$BaseUrl
    )

    $localLines = [System.Collections.Generic.List[string]]::new()

    foreach ($node in $Nodes) {
        $title = Get-NodeTitle -Node $node
        $hrefValue = Try-GetPropValue -Object $node -Name 'href'
        $href = if ($null -ne $hrefValue) { [string]$hrefValue } else { $null }
        $url = Resolve-FullUrl -Href $href -BaseUrl $BaseUrl

        $indent = ('  ' * $Depth)
        if ($null -ne $url) {
            $localLines.Add("$indent- [$title]($url)")
        }
        else {
            $localLines.Add("$indent- $title")
        }

        $children = Try-GetPropValue -Object $node -Name 'children'
        if ($null -ne $children -and $children.Count -gt 0) {
            $childLines = Write-MarkdownToc -Nodes $children -Depth ($Depth + 1) -BaseUrl $BaseUrl
            if ($null -ne $childLines -and @($childLines).Count -gt 0) {
                $localLines.AddRange([string[]]$childLines)
            }
        }
    }

    return $localLines
}

if (-not (Test-Path -LiteralPath $InputPath)) {
    throw "Input file not found: $InputPath"
}

$jsonText = Get-Content -LiteralPath $InputPath -Raw
# File begins with a comment line in your copy (// ...). Strip leading // comment lines.
$jsonText = (($jsonText -split "`r?`n") | Where-Object { $_ -notmatch '^[\s]*//' }) -join "`n"

$toc = $jsonText | ConvertFrom-Json
if ($null -eq $toc.items) {
    throw "No 'items' array found in JSON."
}

$lines = [System.Collections.Generic.List[string]]::new()

# Optional title: use the first node title if present
$topTitle = $null
if ($toc.items.Count -gt 0) {
    $topTitle = Get-NodeTitle -Node $toc.items[0]
}
if ([string]::IsNullOrWhiteSpace($topTitle)) {
    $topTitle = "Azure AI Search TOC"
}

$lines.Add("# $topTitle")
$lines.Add('')

$tocLines = Write-MarkdownToc -Nodes $toc.items -Depth 0 -BaseUrl $BaseUrl
if ($null -ne $tocLines -and @($tocLines).Count -gt 0) {
    $lines.AddRange([string[]]$tocLines)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($OutputPath, $lines, $utf8NoBom)

Write-Host "Wrote Markdown TOC to: $OutputPath"