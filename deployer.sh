#!/bin/bash

set -e

echo "Deploying smart contract...."

npx hardhat ignition deploy ignition/modules/Contract.ts --network localhost --reset


echo "Smart contract deployment completed"

SOURCE_PATH="./artifacts/contracts/Contract.sol/Contract.json"
SOURCE_PATH_ADDR="ignition/deployments/chain-31337/deployed_addresses.json"
DESTINATION="./src/assets/contract"

mkdir -p "$DESTINATION"

echo "Copying contract file"

mv "$SOURCE_PATH" "$DESTINATION"

mv "$SOURCE_PATH_ADDR" "$DESTINATION"

echo "Deployment completed !!!"

node seeder.js

