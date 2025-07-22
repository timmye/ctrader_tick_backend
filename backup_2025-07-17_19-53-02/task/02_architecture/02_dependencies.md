# Dependencies and Installation Commands

## Core Dependencies

### @reiryoku/ctrader-layer
- **Version**: 1.3.0
- **Purpose**: Official cTrader Open API communication layer
- **Install Command**: `npm install @reiryoku/ctrader-layer@1.3.0`

### dotenv
- **Version**: 16.0.0
- **Purpose**: Environment variable management
- **Install Command**: `npm install dotenv@16.0.0`

## Transitive Dependencies (auto-installed)
- **axios**: 0.21.1 (HTTP client for token validation)
- **protobufjs**: 5.0.1 (Protocol buffer encoding/decoding)
- **uuid**: 8.3.2 (Unique message IDs)

## Complete Installation Commands

### Windows PowerShell
```powershell
# Initialize npm project
npm init -y

# Install core dependencies
npm install @reiryoku/ctrader-layer@1.3.0
npm install dotenv@16.0.0

# Verify installation
npm list
```

### Alternative Commands
```powershell
# Install all at once
npm install @reiryoku/ctrader-layer@1.3.0 dotenv@16.0.0

# Install with exact versions
npm install --save-exact @reiryoku/ctrader-layer@1.3.0 dotenv@16.0.0
```

## Environment Setup

### Required Environment Variables
```powershell
# Create .env file
New-Item -ItemType File -Path ".env" -Force

# Set environment variables (replace with actual values)
$env:CTRADER_CLIENT_ID = "your_client_id"
$env:CTRADER_CLIENT_SECRET = "your_client_secret"
$env:CTRADER_ACCESS_TOKEN = "your_access_token"
$env:CTRADER_ACCOUNT_ID = "your_account_id"
```

### .env File Format
```
CTRADER_CLIENT_ID=your_client_id_here
CTRADER_CLIENT_SECRET=your_client_secret_here
CTRADER_ACCESS_TOKEN=your_access_token_here
CTRADER_ACCOUNT_ID=your_account_id_here
```

## Node.js Version Requirements
- **Minimum**: Node.js 12.0.0
- **Recommended**: Node.js 16.0.0 or higher
- **Check Version**: `node --version`

## Windows Path Requirements
- **Project Root**: `c:\Users\tim_n\ticks_v7`
- **Node.js Path**: Should be in system PATH
- **npm Path**: Should be in system PATH