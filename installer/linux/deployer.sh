#!/bin/bash

set -e

echo "Cleaning old Ignition deployments..."

rm -rf ignition/deployments

echo "Compiling contracts..."

npx hardhat compile

echo "Deploying smart contract..."


echo "Smart contract deployment completed"

SOURCE_PATH="./artifacts/contracts/EHR.sol/EHR.json"

SOURCE_PATH_ADDR=$(find ignition/deployments -name deployed_addresses.json | head -n 1)

DESTINATION="./src/assets/contract"

mkdir -p "$DESTINATION"

echo "Copying contract files..."

cp "$SOURCE_PATH" "$DESTINATION"

cp "$SOURCE_PATH_ADDR" "$DESTINATION"

echo "Running seeder..."

node ../seeder.js

echo "Deployment completed !!!"
