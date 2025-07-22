# PowerShell Execution Commands

## Initial Setup Commands

### 1. Navigate to Project Directory
```powershell
cd c:\Users\tim_n\ticks_v7
```

### 2. Initialize Node.js Project
```powershell
npm init -y
```

### 3. Install Dependencies
```powershell
# Install cTrader-layer and dotenv
npm install @reiryoku/ctrader-layer@1.3.0 dotenv@16.0.0

# Verify installation
npm list
```

### 4. Create Environment File
```powershell
# Create .env file
New-Item -ItemType File -Path ".env" -Force

# Add environment variables (replace with actual values)
@"
CTRADER_CLIENT_ID=your_client_id_here
CTRADER_CLIENT_SECRET=your_client_secret_here
CTRADER_ACCESS_TOKEN=your_access_token_here
CTRADER_ACCOUNT_ID=your_account_id_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
```

### 5. Verify Node.js Installation
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version
```

## Development Commands

### 6. Test cTrader Connection
```powershell
# Create test file
@"
const { CTraderConnection } = require('@reiryoku/ctrader-layer');
const connection = new CTraderConnection({
    host: 'demo.ctraderapi.com',
    port: 5035
});

async function testConnection() {
    try {
        await connection.open();
        console.log('Connection successful');
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
"@ | Out-File -FilePath "test-connection.js" -Encoding UTF8

# Run test
node test-connection.js
```

### 7. Get Account Information
```powershell
# Create account info script
@"
const { CTraderConnection } = require('@reiryoku/ctrader-layer');
require('dotenv').config();

async function getAccountInfo() {
    try {
        const accounts = await CTraderConnection.getAccessTokenAccounts(process.env.CTRADER_ACCESS_TOKEN);
        console.log('Available accounts:', accounts);
    } catch (error) {
        console.error('Error:', error);
    }
}

getAccountInfo();
"@ | Out-File -FilePath "get-accounts.js" -Encoding UTF8

# Run account info
node get-accounts.js
```

## Production Commands

### 8. Run Tick Streaming
```powershell
# Run the main application
node stream.js
```

### 9. Monitor Output
```powershell
# Run with output to file
node stream.js > ticks.log 2>&1

# Monitor log in real-time
Get-Content ticks.log -Wait
```

## Debugging Commands

### 10. Enable Debug Mode
```powershell
# Set debug environment variable
$env:DEBUG = "ctrader:*"

# Run with debug output
node stream.js
```

### 11. Check Environment Variables
```powershell
# Display current environment variables
Get-ChildItem Env: | Where-Object { $_.Name -like "*CTRADER*" }
```

## Cleanup Commands

### 12. Remove Node Modules
```powershell
# Remove node_modules and package-lock
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Reinstall dependencies
npm install
```

## Windows-Specific Notes

### Path Requirements
- Ensure Node.js is in system PATH: `C:\Program Files\nodejs\`
- Ensure npm is in system PATH: `C:\Users\%USERNAME%\AppData\Roaming\npm`

### PowerShell Execution Policy
```powershell
# Check execution policy
Get-ExecutionPolicy

# Set execution policy if needed (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Quick Start Script
```powershell
# Save as setup.ps1
@"
# Quick setup script
Write-Host "Setting up cTrader tick streaming..."

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
}

# Install dependencies
npm install @reiryoku/ctrader-layer@1.3.0 dotenv@16.0.0

# Create .env template
if (!(Test-Path ".env")) {
    @"
CTRADER_CLIENT_ID=your_client_id_here
CTRADER_CLIENT_SECRET=your_client_secret_here
CTRADER_ACCESS_TOKEN=your_access_token_here
CTRADER_ACCOUNT_ID=your_account_id_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Created .env file. Please update with your credentials."
}

Write-Host "Setup complete. Edit .env file and run 'node stream.js'"
"@ | Out-File -FilePath "setup.ps1" -Encoding UTF8

# Run setup
.\setup.ps1