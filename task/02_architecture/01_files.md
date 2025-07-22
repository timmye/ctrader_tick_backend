# File Structure for Symbol Subscription & Live Terminal Display

## Extension to Existing Structure
```
ticks_v7/
├── stream.js                          # Existing - will be extended
├── package.json                       # Existing - will be updated
├── .env                              # Existing - may add display settings
├── src/
│   ├── subscription/
│   │   ├── SymbolSubscription.js     # New - manages symbol subscriptions
│   │   ├── SubscriptionManager.js    # New - handles multiple symbols
│   │   └── symbols.json             # New - available symbols cache
│   ├── display/
│   │   ├── TerminalDisplay.js        # New - blessed terminal interface
│   │   ├── PriceTable.js            # New - price table renderer
│   │   └── ColorFormatter.js        # New - price color formatting
│   └── cli/
│       ├── SymbolSelector.js        # New - interactive symbol selection
│       └── CommandParser.js         # New - CLI argument parsing
├── bin/
│   ├── subscribe.js                 # New - CLI for symbol subscription
│   └── live-display.js              # New - terminal price display
└── config/
    ├── display.json                 # New - display configuration
    └── default-symbols.json         # New - default symbol list
```

## Modified Existing Files
- **stream.js**: Add subscription hooks and message routing
- **package.json**: Add terminal display dependencies
- **.env**: Add display-related environment variables

## New Entry Points
- **bin/subscribe.js**: Command-line symbol subscription tool
- **bin/live-display.js**: Terminal-based live price display