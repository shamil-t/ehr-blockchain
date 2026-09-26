# Deploy the smart contract and seed the data

# Get project root directory (2 levels up from this script: installer/windows -> project root)
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

Write-Output "Project root: $PROJECT_ROOT"

# Push to project root directory for all operations
Push-Location $PROJECT_ROOT

try {
  Write-Output "Cleaning up old ignition deployments"

  $IGNITION_DEPLOYMENT_PATH = "ignition/deployments"

  if(Test-Path $IGNITION_DEPLOYMENT_PATH){
    Remove-Item -Recurse -Force $IGNITION_DEPLOYMENT_PATH
  }

  Write-Output "Compiling smart contracts started..."

  npx hardhat compile

  Write-Output "Successfully compiled the smart contracts."

  Write-Output "Smart contract deployment started"

  npx hardhat ignition deploy ignition/modules/EHR.ts --network localhost

  Write-Output "Successfully deployed the smart contract"

  $SOURCE_PATH = "artifacts/contracts/EHR.sol/EHR.json"

  $SOURCE_PATH_ADDR = (Get-ChildItem $IGNITION_DEPLOYMENT_PATH -Recurse -Filter "deployed_addresses.json" | Select-Object -First 1).FullName

  $DESTINATION = "src/assets/contract"

  Write-Output "Copying contract files to $DESTINATION"

  if(-not (Test-Path $DESTINATION)){
    New-Item -ItemType Directory -Path $DESTINATION -Force | Out-Null
  }

  if(Test-Path $SOURCE_PATH){
    Copy-Item "$SOURCE_PATH" "$DESTINATION" -Force
  } else {
    Write-Output "Warning: $SOURCE_PATH not found"
  }

  if($SOURCE_PATH_ADDR -and (Test-Path $SOURCE_PATH_ADDR)){
    Copy-Item "$SOURCE_PATH_ADDR" "$DESTINATION" -Force
  } else {
    Write-Output "Warning: deployed_addresses.json not found at $SOURCE_PATH_ADDR"
  }

  Write-Output "Running Seeder"

  node "installer/seeder.js"

  Write-Output "Deployment completed !!!"

} finally {
  Pop-Location
}

