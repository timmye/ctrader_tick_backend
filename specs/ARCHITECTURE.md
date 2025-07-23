# cTrader Live Tick Streamer - Architecture Cleanup Plan

## File Structure Cleanup

### Files to Remove
- `bin/subscribe.js` - Symbol management CLI (redundant)
- `src/cli/SymbolSelector.js` - Interactive symbol selection (unused)
- `test/test-subscription.js` - Test file (can be integrated)

### Files to Keep
- `bin/live-display.js` - Terminal UI entry point
- `bin/stream.js` - Core streaming app
- `src/subscription/SymbolSubscription.js` - Core subscription logic
- `src/display/TerminalDisplay.js` - Terminal UI rendering
- `src/display/PriceTable.js` - Price table formatting
- `debug.js` - Debugging utility

### Updated Package.json Scripts
```json
{
  "scripts": {
    "stream": "node bin/stream.js",
    "live-display": "node bin/live-display.js",
    "debug": "node debug.js"
  }
}
```

### Directory Structure After Cleanup
```
c:/Users/tim_n/ticks_v7/
├── .env
├── .env.example
├── package.json
├── package-lock.json
├── README.md
├── debug.js
├── bin/
│   ├── stream.js
│   └── live-display.js
├── src/
│   ├── display/
│   │   ├── TerminalDisplay.js
│   │   └── PriceTable.js
│   └── subscription/
│       └── SymbolSubscription.js
└── node_modules/
```

## Dependencies (Current)
- `@reiryoku/ctrader-layer@latest` - cTrader API wrapper
- `blessed@^0.1.81` - Terminal UI framework
- `dotenv@^16.0.0` - Environment configuration
- `events@^3.3.0` - Event handling (Node.js built-in)

## Environment Variables Required
```
.env
```

## PowerShell Commands for Cleanup
```powershell
# Remove unused files
Remove-Item -Path "bin/subscribe.js" -Force
Remove-Item -Path "src/cli/SymbolSelector.js" -Force
Remove-Item -Path "test/test-subscription.js" -Force

# Update package.json scripts
# (Manual edit required - architect mode restriction)
```

## Integration Points
- SymbolSubscription.js: Core subscription management
- TerminalDisplay.js: UI rendering layer
- PriceTable.js: Data formatting layer
- CTraderConnection: External API dependency