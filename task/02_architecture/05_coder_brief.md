# Coder Brief: Symbol Subscription & Live Terminal Display

## Objective
Extend existing cTrader connection to support interactive symbol subscription and real-time price display in terminal.

## Architecture Summary
- **Extension-based**: Builds on existing stream.js without breaking changes
- **Modular design**: Separate concerns for subscription, display, and CLI
- **Terminal-first**: Blessed-based terminal interface for live prices
- **Interactive CLI**: Symbol selection and management via command line

## Key Components

### 1. Symbol Subscription
- **SymbolSubscription.js**: Manages individual symbol subscriptions
- **SubscriptionManager.js**: Handles multiple symbols and state
- Integrates with existing WebSocket connection

### 2. Terminal Display
- **TerminalDisplay.js**: Main terminal interface using blessed
- **PriceTable.js**: Formatted price table with color coding
- **ColorFormatter.js**: Price change color formatting

### 3. CLI Interface
- **SymbolSelector.js**: Interactive symbol selection
- **CommandParser.js**: CLI argument parsing
- **bin/subscribe.js**: Subscription CLI tool
- **bin/live-display.js**: Live display CLI tool

## Implementation Order
1. Install new dependencies
2. Create configuration files
3. Implement SymbolSubscription class
4. Implement TerminalDisplay class
5. Create CLI tools
6. Integrate with existing stream.js

## Testing Strategy
- Test symbol subscription with mock data
- Verify terminal display renders correctly
- Test CLI argument parsing
- Validate integration with existing connection

## Performance Targets
- Update interval: 100ms (configurable)
- Max display rows: 20 (configurable)
- Memory usage: <50MB for 20 symbols

## Security Considerations
- Reuse existing authentication
- Validate symbol names
- Sanitize CLI input

## Handoff Status: READY_FOR_CODER
All architecture decisions complete. Files structure defined, dependencies specified, interfaces documented, and execution commands provided.