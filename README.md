# Decentralized Electronic Health Record (EHR) System

## Overview

This project is a decentralized Electronic Health Record (EHR) management system built using:

- Solidity Smart Contracts
- Ethereum Blockchain
- IPFS (InterPlanetary File System)
- ethers.js
- MetaMask
- Angular
- Local Anvil Node

The system enables secure and decentralized management of:
- Patients
- Doctors
- Appointments
- Medical Records
- Access Permissions

The architecture follows an IPFS-first design where sensitive medical data is stored off-chain while only essential references and permissions are maintained on-chain.

---

# Objectives

The main goals of this project are:

- Eliminate centralized health record dependency
- Ensure tamper-resistant medical history
- Enable decentralized ownership of health records
- Provide secure doctor-patient access control
- Reduce data duplication and unauthorized access
- Learn Web3-based healthcare architecture

---

# Technology Stack

| Technology | Purpose |
|---|---|
| Solidity | Smart Contract Development |
| Ethereum | Blockchain Network |
| Anvil | Local Ethereum Development Node |
| Hardhat | Smart Contract Tooling |
| ethers.js | Blockchain Interaction |
| MetaMask | Wallet Authentication |
| IPFS | Decentralized File Storage |
| Angular | Frontend Application |
| TypeScript | Frontend Logic |

---

# System Architecture

## Blockchain Stores

The blockchain stores:
- Wallet addresses
- User roles
- Appointment references
- Medical record references
- Access permissions
- IPFS content identifiers (CIDs)

## IPFS Stores

IPFS stores:
- Patient profile metadata
- Doctor profile metadata
- Appointment metadata
- Medical record metadata
- Uploaded medical files/documents

---

# User Roles

## Admin
Responsible for:
- Registering doctors
- Registering patients

## Doctor
Can:
- View authorized patient records
- Add medical records
- Approve/reject appointments
- View appointments

## Patient
Can:
- Book appointments
- Grant/revoke doctor access
- View own medical records
- Cancel appointments

---

# Smart Contract Modules

## 1. User Management

### Features
- Register doctors
- Register patients
- Validate user roles

### Data Stored
```solidity
struct User {
    address id;
    string profileCID;
    bool exists;
}
```

---

## 2. Appointment Management

### Features
- Book appointments
- Update appointment status
- View appointments by user
- Admin can view all appointments

### Appointment Status
- PENDING
- APPROVED
- REJECTED
- COMPLETED
- CANCELED

### Data Structure
```solidity
struct Appointment {
    uint256 id;
    address patient;
    address doctor;
    string metadataCID;
    uint256 appointmentTime;
    AppointmentStatus status;
    uint256 createdAt;
}
```

---

## 3. Medical Record Management

### Features
- Upload medical records
- Retrieve patient records
- Access-controlled record viewing

### Data Structure
```solidity
struct MedicalRecord {
    uint256 id;
    address patient;
    address doctor;
    string metadataCID;
    string filesCID;
    uint256 createdAt;
}
```

---

## 4. Access Control

Patients can:
- Grant doctors access to records
- Revoke doctor access

Doctors can:
- Access records only when permission is granted

### Permission Mapping
```solidity
mapping(address => mapping(address => bool))
private doctorAccess;
```

---

# Smart Contract Design Principles

## Minimal On-Chain Storage

Sensitive data is NOT stored directly on-chain.

Only:
- references
- permissions
- relationships
- metadata CIDs

are stored on blockchain.

---

## Single Source of Truth

Appointments and records are stored using:
```solidity
mapping(uint256 => Appointment)
mapping(uint256 => MedicalRecord)
```

with indexed relationships for scalability.

---

## Access-Controlled Data Retrieval

Medical records are accessible only if:
- requester is the patient
- requester is an authorized doctor

---

# Workflow

## Patient Registration
1. Admin registers patient
2. Patient profile uploaded to IPFS
3. CID stored on blockchain

---

## Doctor Registration
1. Admin registers doctor
2. Doctor profile uploaded to IPFS
3. CID stored on blockchain

---

## Appointment Booking
1. Patient selects doctor
2. Appointment metadata uploaded to IPFS
3. Appointment stored on blockchain

---

## Medical Record Upload
1. Doctor receives permission
2. Medical files uploaded to IPFS
3. CID references stored on blockchain

---

# Security Features

- Role-based access control
- Permission-controlled medical records
- Immutable blockchain records
- Decentralized storage
- Patient-controlled authorization

---

# Advantages

- Decentralized architecture
- Improved transparency
- Tamper resistance
- Reduced centralized dependency
- Better interoperability
- Patient ownership of data

---

# Limitations

- Blockchain transaction costs
- Public blockchain metadata visibility
- IPFS availability management
- No encryption implemented in MVP
- Limited scalability without indexing

---

# Future Improvements

- Encrypted IPFS payloads
- Hospital management module
- Prescription management
- Pagination support
- Event indexing
- Audit logs
- Multi-admin support
- The Graph integration
- Role-based dashboards
- JWT + Web3 hybrid auth
- File encryption and key management

---

# Installation and Local Run

The local development environment uses Anvil for the blockchain, Kubo (IPFS) for
file storage, and the Angular CLI for the web application. The installer scripts
start the blockchain, IPFS, and frontend; contract deployment is a separate step.

## Prerequisites

Install the following and make sure each command is available in your terminal:

- Git
- Node.js 22 LTS and npm
- pnpm (for example, `npm install --global pnpm`)
- Foundry, including Anvil
- Kubo IPFS (`ipfs`)
- `nc`/netcat on Linux and macOS (used by the startup script to wait for services)

Use the official installation instructions for
[Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/installation),
[Foundry](https://book.getfoundry.sh/getting-started/installation), and
[Kubo](https://docs.ipfs.tech/install/command-line/).

From the repository root, install the project dependencies:

```sh
pnpm install --frozen-lockfile
```

## Windows

Open PowerShell in the repository root and start the services:

```powershell
.\installer\windows\Run-StartProject.ps1
```

If PowerShell blocks the script, allow scripts for this terminal session only,
then run it again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\installer\windows\Run-StartProject.ps1
```

In a second PowerShell window at the repository root, deploy the contract and
seed the local IPFS/blockchain environment:

```powershell
.\installer\windows\Run-Deployer.ps1
```

## Linux

From the repository root, make the scripts executable once, then start the
services:

```sh
chmod +x installer/linux/start-project.sh installer/linux/deployer.sh
./installer/linux/start-project.sh
```

In a second terminal at the repository root, deploy the contract and seed the
local environment:

```sh
./installer/linux/deployer.sh
```

## macOS

There is no separate macOS installer script. The Bash scripts under
`installer/linux` are also used for macOS. Install the prerequisites above,
including Anvil, Kubo, and netcat, then run from the repository root:

```sh
chmod +x installer/linux/start-project.sh installer/linux/deployer.sh
./installer/linux/start-project.sh
```

In a second Terminal window at the repository root, deploy and seed:

```sh
./installer/linux/deployer.sh
```

## Open and Stop the App

The startup script opens the Angular app at `http://localhost:4200`. Keep the
startup terminal running while using the app; press **Ctrl+C** there to stop
the services. The scripts use the local Anvil RPC at port `8545` and the IPFS
API/gateway at ports `5001` and `8080`. On first startup, IPFS is initialized
automatically if it has not already been initialized.

## Run Components Manually

To run only the frontend after installing dependencies:

```sh
pnpm start
```

To compile and deploy the smart contract manually, first start Anvil in one
terminal, then run these commands from the repository root:

```sh
npx hardhat compile
npx hardhat ignition deploy ignition/modules/EHR.ts --network localhost
```

---

# Project Structure

```text
contracts/
├── EHR.sol

ignition/
├── modules/
│   └── EHR.ts

installer/
├── linux/
├── windows/
└── seeder.js

src/
└── app/

package.json
hardhat.config.ts
```

---

# Conclusion

This project demonstrates a decentralized healthcare record management system using blockchain and IPFS technologies. The architecture prioritizes:
- decentralized ownership
- secure access control
- scalable smart contract design
- minimal on-chain storage

The implementation serves as a strong MVP foundation for future enterprise-grade decentralized healthcare applications.
