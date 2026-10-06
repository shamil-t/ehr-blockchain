#!/bin/bash

set -e

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Cleaning old Ignition deployments..."

rm -rf ignition/deployments

echo "Compiling contracts..."

npx hardhat compile

echo "Deploying smart contract..."

npx hardhat ignition deploy ignition/modules/EHR.ts --network localhost

echo "Smart contract deployment completed"

SOURCE_PATH="./artifacts/contracts/EHR.sol/EHR.json"

SOURCE_PATH_ADDR=$(find ignition/deployments -name deployed_addresses.json | head -n 1)

DESTINATION="./src/assets/contract"

mkdir -p "$DESTINATION"

echo "Copying contract files..."

cp "$SOURCE_PATH" "$DESTINATION"

cp "$SOURCE_PATH_ADDR" "$DESTINATION"

echo "Running seeder..."

node installer/seeder.js

echo "Deployment completed !!!"
