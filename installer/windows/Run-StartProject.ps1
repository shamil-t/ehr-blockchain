# Start EHR 2.0

$ErrorActionPreference = "Stop"

function Stop-ProcessOnPort
{
  param([int]$Port)

  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

  if ($connection)
  {
    Stop-Process -Id $connection.OwningProcess -Force
  }
}


function Cleanup
{
  Write-Host ""
  Write-Host "Stopping services..."


  Write-Host "Stopping existing services..."

  foreach ($proc in @($IPFS_PROCESS, $ANVIL_PROCESS, $ANGULAR_PROCESS))
  {
    if ($proc -and -not $proc.HasExited)
    {
      try
      {
        Stop-Process -Id $proc.Id -Force
      }
      catch
      {
        # Ignore errors
      }
    }
  }

  #  Hard CleanUp

  Stop-ProcessOnPort 4200   # Angular
  Stop-ProcessOnPort 8545   # Anvil
  Stop-ProcessOnPort 5001   # IPFS API
}

# Run cleanup when the script exits or Ctrl+C is pressed
Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

try
{
  Write-Host "Starting IPFS..."

  Write-Host "Checking IPFS repository..."

  $ipfsRepo = Join-Path $env:USERPROFILE ".ipfs"

  if (-not (Test-Path $ipfsRepo))
  {
    Write-Host "Initializing IPFS..."
    ipfs init
  }

  Write-Host "Starting IPFS..."

  $IPFS_PROCESS = Start-Process ipfs `
    -ArgumentList "daemon" `
    -PassThru -NoNewWindow

  Write-Host "Starting Anvil..."

  $anvilArgs = @("--balance", "100")

  if (Test-Path "state.json")
  {
    $anvilArgs += @("--load-state", "state.json")
  }

  $anvilArgs += @("--dump-state", "state.json")

  $ANVIL_PROCESS = Start-Process anvil `
    -ArgumentList $anvilArgs `
    -PassThru -NoNewWindow

  Write-Host "Starting Angular..."

  $ANGULAR_PROCESS = Start-Process ng.cmd `
    -ArgumentList "serve -o" `
    -PassThru -NoNewWindow

  Write-Host "Waiting for Anvil RPC..."

  do
  {
    Start-Sleep -Seconds 1
    $anvilReady = Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -InformationLevel Quiet
  } until ($anvilReady)

  Write-Host "Waiting for IPFS API..."

  do
  {
    Start-Sleep -Seconds 1
    $ipfsReady = Test-NetConnection -ComputerName 127.0.0.1 -Port 5001 -InformationLevel Quiet
  } until ($ipfsReady)

  Write-Host "Services ready"

  # .\deployer.ps1

#  & "$PSScriptRoot\Run-Deployer.ps1"

  # Wait until the processes exit
  Wait-Process -Id $IPFS_PROCESS.Id, $ANVIL_PROCESS.Id, $ANGULAR_PROCESS.Id
}
finally
{
  Cleanup
}
