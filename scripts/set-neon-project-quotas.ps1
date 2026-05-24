param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [int]$ActiveHours = 10,
  [int]$ComputeHours = 3,
  [int]$WrittenGb = 1,
  [int]$BranchSizeGb = 1
)

$ErrorActionPreference = "Stop"

$apiKey = [Environment]::GetEnvironmentVariable("NEON_API_KEY", "Process")
if (-not $apiKey) {
  $apiKey = [Environment]::GetEnvironmentVariable("NEON_API_KEY", "User")
}

if (-not $apiKey) {
  throw "Set NEON_API_KEY before running this script."
}

$quota = @{
  active_time_seconds  = $ActiveHours * 60 * 60
  compute_time_seconds = $ComputeHours * 60 * 60
  written_data_bytes   = [int64]$WrittenGb * 1024 * 1024 * 1024
  logical_size_bytes   = [int64]$BranchSizeGb * 1024 * 1024 * 1024
}

$body = @{
  project = @{
    settings = @{
      quota = $quota
    }
  }
} | ConvertTo-Json -Depth 8

$headers = @{
  Accept        = "application/json"
  Authorization = "Bearer $apiKey"
  "Content-Type" = "application/json"
}

$response = Invoke-RestMethod `
  -Method Patch `
  -Uri "https://console.neon.tech/api/v2/projects/$ProjectId" `
  -Headers $headers `
  -Body $body

[pscustomobject]@{
  project_id            = $ProjectId
  active_time_seconds   = $quota.active_time_seconds
  compute_time_seconds  = $quota.compute_time_seconds
  written_data_bytes    = $quota.written_data_bytes
  logical_size_bytes    = $quota.logical_size_bytes
  project_name          = $response.project.name
} | ConvertTo-Json -Compress
