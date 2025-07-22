# File Structure and Directory Layout

## Project Root
```
ticks_v7/
├── package.json                    # Node.js dependencies
├── stream.js                       # Main tick streaming application
├── .env                           # Environment variables (not in repo)
├── task/
│   ├── 01_requirements/           # Requirements documents
│   └── 02_architecture/           # Architecture documents
└── node_modules/                  # Installed dependencies
```

## Core Files

### stream.js
- **Purpose**: Main application file for cTrader tick streaming
- **Location**: `c:/Users/tim_n/ticks_v7/stream.js`
- **Function**: Connects to cTrader Open API and streams live tick data
- **Dependencies**: @reiryoku/ctrader-layer v1.3.0

### package.json
- **Purpose**: Node.js project manifest with dependencies
- **Location**: `c:/Users/tim_n/ticks_v7/package.json`
- **Key Dependencies**:
  - @reiryoku/ctrader-layer: 1.3.0
  - dotenv: 16.0.0

### .env
- **Purpose**: Environment variables for cTrader API credentials
- **Location**: `c:/Users/tim_n/ticks_v7/.env`
- **Required Variables**:
  - CTRADER_CLIENT_ID
  - CTRADER_CLIENT_SECRET
  - CTRADER_ACCESS_TOKEN
  - CTRADER_ACCOUNT_ID

## Architecture Documents
- **01_files.md**: This file - exact file paths and directory structure
- **02_dependencies.md**: Specific package versions and install commands
- **03_interfaces.md**: Function signatures and data structures
- **04_execution.md**: Exact PowerShell commands for setup and execution