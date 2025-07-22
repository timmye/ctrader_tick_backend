# Coder Brief: cTrader Live Tick Streaming

## Objective
Create a minimal Node.js application that connects to cTrader Open API and streams live tick data using the official @reiryoku/ctrader-layer v1.3.0 library.

## What to Build
A single `stream.js` file that:
1. Connects to cTrader API via WebSocket TLS
2. Authenticates with application and account credentials
3. Subscribes to live tick data for specified symbols
4. Outputs tick data to console in real-time

## Key Requirements
- **Live data only** (no simulation)
- **Real-time output** to console
- **Error handling** for connection failures
- **Graceful shutdown** on SIGINT

## Implementation Steps

### 1. Setup Environment
```powershell
npm init -y
npm install @reiryoku/ctrader-layer@1.3.0 dotenv@16.0.0
```

### 2. Create .env File
```
CTRADER_CLIENT_ID=your_client_id
CTRADER_CLIENT_SECRET=your_client_secret
CTRADER_ACCESS_TOKEN=your_access_token
CTRADER_ACCOUNT_ID=your_account_id
```

### 3. Core Implementation Flow
1. **Import**: `require('@reiryoku/ctrader-layer')`
2. **Connect**: `new CTraderConnection({host: 'demo.ctraderapi.com', port: 5035})`
3. **Auth**: Send `ProtoOAApplicationAuthReq` then `ProtoOAAccountAuthReq`
4. **Subscribe**: Send `ProtoOASubscribeSpotsReq` with symbol IDs
5. **Listen**: Handle `ProtoOASpotEvent` (payloadType 2131)
6. **Format**: Convert prices from 1/100,000 units to decimal

### 4. Message Types to Use
- **2100**: ProtoOAApplicationAuthReq
- **2102**: ProtoOAAccountAuthReq
- **2127**: ProtoOASubscribeSpotsReq
- **2131**: ProtoOASpotEvent (tick data)

### 5. Data Format
```javascript
// ProtoOASpotEvent structure
{
  symbolId: 1,           // EUR/USD
  bid: 123456,           // 1.23456 (divide by 100000)
  ask: 123459,           // 1.23459
  timestamp: 1623456789000
}
```

### 6. Error Handling
- Connection failures
- Authentication failures
- Subscription failures
- Network disconnections

### 7. Output Format
```
[TIMESTAMP] SYMBOL BID/ASK
[2024-01-15 14:30:45.123] EURUSD 1.23456/1.23459
```

## Testing Checklist
- [ ] Connection establishes successfully
- [ ] Authentication completes
- [ ] Tick data streams continuously
- [ ] Price conversion is accurate
- [ ] Error messages are clear
- [ ] Graceful shutdown works

## Files to Create
- `stream.js` (main application)
- `package.json` (auto-generated)
- `.env` (credentials - not in repo)

## Files Provided
- Architecture documents in `task/02_architecture/`

## Constraints
- **No additional frameworks** - use only cTrader-layer
- **No database** - console output only
- **No web server** - CLI application
- **Windows PowerShell** environment