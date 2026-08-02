# Deploy the smart contract and seed the data

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

Write-Output "Succesfully deployed the smart contract"

$SOURCE_PATH="./artifacts/contracts/EHR.sol/EHR.json"

$SOURCE_PATH_ADDR= (Get-ChildItem $IGNITION_DEPLOYMENT_PATH -Recurse -Filter "deployed_addresses.json" | Select-Object -First 1).FullName.Replace("$PWD\","")

$DESTINATION="./src/assets/contract"

Write-Output "Copying contract files to $DESTINATION"

if(-not (Test-Path $DESTINATION)){
  mkdir $DESTINATION
}

Copy-Item "$SOURCE_PATH" "$DESTINATION" -Recurse

Copy-Item "$SOURCE_PATH_ADDR" "$DESTINATION" -Recurse

Write-Output "Running Seeder"

node "$PSScriptRoot\..\seeder.js"

Write-Output "Deployment completed !!!"

