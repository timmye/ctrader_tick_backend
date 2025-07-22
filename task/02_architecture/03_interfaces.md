# Function Signatures & Data Structures

## Symbol Subscription Interface
```javascript
// SymbolSubscription.js
class SymbolSubscription {
  constructor(connection, authToken) {}
  
  async subscribe(symbolName) {}
  async unsubscribe(symbolName) {}
  getSubscribedSymbols() {}
  onTick(callback) {}
  onError(callback) {}
}

// SubscriptionManager.js
class SubscriptionManager {
  constructor(symbolSubscription) {}
  
  async addSymbol(symbol) {}
  async removeSymbol(symbol) {}
  listSymbols() {}
  clearAll() {}
}
```

## Terminal Display Interface
```javascript
// TerminalDisplay.js
class TerminalDisplay {
  constructor() {}
  
  start() {}
  stop() {}
  updatePrice(symbol, bid, ask, timestamp) {}
  addSymbol(symbol) {}
  removeSymbol(symbol) {}
  setUpdateInterval(ms) {}
}

// PriceTable.js
class PriceTable {
  constructor(screen) {}
  
  render(prices) {}
  clear() {}
  formatPrice(price) {}
  formatSpread(bid, ask) {}
}
```

## CLI Interface
```javascript
// SymbolSelector.js
class SymbolSelector {
  async selectSymbols(availableSymbols) {}
  async confirmAction(message) {}
}

// CommandParser.js
class CommandParser {
  static parseArgs(args) {}
  static validateSymbol(symbol) {}
}
```

## Data Structures
```javascript
// PriceUpdate structure
{
  symbol: string,
  bid: number,
  ask: number,
  spread: number,
  timestamp: Date,
  change: number
}

// SubscriptionRequest structure
{
  symbol: string,
  action: 'subscribe' | 'unsubscribe'
}