#!/bin/bash

set -e

cleanup() {
  echo ""
  echo "Stopping services..."

  kill $IPFS_PID 2>/dev/null || true
  kill $ANVIL_PID 2>/dev/null || true
  kill $ANGULAR_PID 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting IPFS..."

ipfs daemon &
IPFS_PID=$!

echo "Starting Anvil..."

anvil --balance 100 --dump-state state.json &
ANVIL_PID=$!

echo "Starting Angular..."

ng serve -o &
ANGULAR_PID=$!

echo "Waiting for Anvil RPC..."

until nc -z 127.0.0.1 8545; do
  sleep 1
done

echo "Waiting for IPFS API..."

until nc -z 127.0.0.1 5001; do
  sleep 1
done

echo "Services ready"

#./deployer.sh

wait
