# Implementation Specification - Symbol Subscription & Terminal Display

## PowerShell Setup Commands

### 1. Directory Structure Creation
```powershell
# Create new directories
New-Item -ItemType Directory -Path "src\subscription" -Force
New-Item -ItemType Directory -Path "src\display" -Force
New-Item -ItemType Directory -Path "src\cli" -Force
New-Item -ItemType Directory -Path "bin" -Force
New-Item -ItemType Directory -Path "config" -Force
```

### 2. Environment Variables Setup
```powershell
# Add to root .env file
Add-Content -Path ".env" -Value "`n# Terminal Display Settings"
Add-Content -Path ".env" -Value "DISPLAY_UPDATE_INTERVAL=1000"
Add-Content -Path ".env" -Value "MAX_DISPLAY_SYMBOLS=20"
Add-Content -Path ".env" -Value "DEFAULT_SYMBOLS=XAUUSD,EURUSD,GBPUSD,USDJPY"

# Create web/.env if not exists
if (!(Test-Path "web\.env")) {
    New-Item -ItemType File -Path "web\.env" -Force
    Add-Content -Path "web\.env" -Value "WEB_PORT=3000"
    Add-Content -Path "web\.env" -Value "WEBSOCKET_PORT=8080"
}
```

### 3. Dependencies Installation
```powershell
# Install terminal display dependencies
npm install --save-exact blessed@0.1.81 blessed-contrib@4.11.0 chalk@4.1.2 cli-table3@0.6.3 commander@9.4.1 inquirer@8.2.5

# Update package.json scripts
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts | Add-Member -NotePropertyName "subscribe" -NotePropertyValue "node bin/subscribe.js"
$packageJson.scripts | Add-Member -NotePropertyName "display" -NotePropertyValue "node bin/live-display.js"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
```

### 4. File Creation Commands
```powershell
# Create empty files for implementation
New-Item -ItemType File -Path "src/subscription/SymbolSubscription.js" -Force
New-Item -ItemType File -Path "src/subscription/SubscriptionManager.js" -Force
New-Item -ItemType File -Path "src/subscription/symbols.json" -Force
New-Item -ItemType File -Path "src/display/TerminalDisplay.js" -Force
New-Item -ItemType File -Path "src/display/PriceTable.js" -Force
New-Item -ItemType File -Path "src/display/ColorFormatter.js" -Force
New-Item -ItemType File -Path "src/cli/SymbolSelector.js" -Force
New-Item -ItemType File -Path "src/cli/CommandParser.js" -Force
New-Item -ItemType File -Path "bin/subscribe.js" -Force
New-Item -ItemType File -Path "bin/live-display.js" -Force
New-Item -ItemType File -Path "config/display.json" -Force
New-Item -ItemType File -Path "config/default-symbols.json" -Force
```

### 5. Configuration Files Setup
```powershell
# Create default symbols configuration
@'
{
  "symbols": [
    "XAUUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "AUDUSD",
    "USDCAD",
    "USDCHF",
    "NZDUSD"
  ]
}
'@ | Set-Content -Path "config/default-symbols.json"

# Create display configuration
@'
{
  "updateInterval": 1000,
  "maxSymbols": 20,
  "colors": {
    "up": "green",
    "down": "red",
    "neutral": "yellow"
  },
  "table": {
    "borderStyle": "line",
    "headerStyle": "bold"
  }
}
'@ | Set-Content -Path "config/display.json"
```

### 6. Windows Path Requirements
```powershell
# Ensure Node.js is in PATH
$nodePath = (Get-Command node).Source
if ($nodePath) {
    Write-Host "Node.js found at: $nodePath"
} else {
    Write-Host "Node.js not found in PATH. Please install Node.js from nodejs.org"
}

# Verify npm is available
$npmPath = (Get-Command npm).Source
if ($npmPath) {
    Write-Host "npm found at: $npmPath"
} else {
    Write-Host "npm not found in PATH"
}

# Set execution policy for scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 7. Verification Commands
```powershell
# Verify directory structure
Get-ChildItem -Recurse -Directory | Select-Object FullName

# Verify files created
Get-ChildItem -Recurse -File | Where-Object { $_.Name -match "\.(js|json)$" } | Select-Object FullName

# Test npm scripts
npm run --help
```

## Environment Variables Reference

### Root .env Variables
```
# Existing cTrader configuration
CTRADER_CLIENT_ID=your_client_id
CTRADER_SECRET=your_secret
CTRADER_ACCESS_TOKEN=your_access_token
CTRADER_ACCOUNT_ID=your_account_id
CTRADER_ENVIRONMENT=sandbox

# Terminal Display Settings
DISPLAY_UPDATE_INTERVAL=1000
MAX_DISPLAY_SYMBOLS=20
DEFAULT_SYMBOLS=XAUUSD,EURUSD,GBPUSD,USDJPY
```

### Web .env Variables
```
WEB_PORT=3000
WEBSOCKET_PORT=8080
```

## NPM Scripts Usage
```powershell
# Start main streaming application
npm start

# Interactive symbol subscription
npm run subscribe

# Terminal price display
npm run display
```

## Ready for Coder Status
✅ Directory structure created
✅ Dependencies specified
✅ Environment variables defined
✅ File templates prepared
✅ PowerShell commands documented
✅ Windows path requirements specified