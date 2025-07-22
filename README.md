# cTrader Live Tick Streamer

Real-time forex tick streaming from cTrader Open API with Node.js.

## Quick Start

### 1. Setup Environment
```powershell
# Install dependencies
npm install

# Configure credentials
Copy-Item .env.example .env
# Edit .env with your cTrader credentials
```

### 2. Run Applications

**Basic Stream (Console Output):**
```powershell
node stream
```

**Live Terminal Display (Rich UI):**
```powershell
node bin/live-display.js --symbols EURUSD,GBPUSD
```

**Test Subscription System:**
```powershell
npm run test-subscription
```

## Environment Configuration

Create `.env` file:
```
CTRADER_ACCESS_TOKEN=your_access_token_here
CTRADER_ACCOUNT_ID=your_account_id_here
HOST=demo.ctraderapi.com
PORT=5035
SYMBOLS=USDJPY,EURUSD,AUDUSD
```

## Architecture Overview

```
src/
├── display/              # UI components
│   ├── TerminalDisplay.js
│   └── PriceTable.js
└── subscription/         # Symbol subscription logic
    └── SymbolSubscription.js

bin/
├── live-display.js       # Terminal UI entry point
└── stream.js            # Core streaming app
```

## For LLM Development

### Key Components
- **SymbolSubscription.js**: Core subscription management
- **CTraderConnection**: External dependency for API connection
- **EventEmitter**: Used for tick data propagation

### Data Flow
```
CTraderConnection → SymbolSubscription → Display/UI
```

### Error Handling
- Connection failures handled with retry logic
- Authentication errors logged to console
- Symbol validation before subscription

### Testing
- Mock connection available for isolated testing
- Test suite covers subscription lifecycle
- Debug mode available for troubleshooting

## Troubleshooting

### Common Issues
1. **"Cannot read properties of undefined"**: Check .env configuration
2. **Connection timeout**: Verify network access to cTrader API
3. **Authentication failed**: Validate access token and account ID

### Debug Mode
```powershell
node debug.js
```

## Dependencies
- `@reiryoku/ctrader-layer`: cTrader API wrapper
- `blessed`: Terminal UI framework
- `dotenv`: Environment configuration
- `events`: Event handling

## Windows PowerShell Notes
- Use PowerShell 7+ for best compatibility
- Ensure Node.js 16+ is installed
- Run commands from project root directory