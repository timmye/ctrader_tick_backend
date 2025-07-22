# Next LLM Role Brief: Code Implementation

## Context
Architecture for symbol subscription and live terminal price display is complete. The system extends existing cTrader connection with terminal-based price monitoring.

## Immediate Tasks for Code Mode
1. **Install Dependencies**: Run PowerShell commands from task/02_architecture/04_execution.md
2. **Create Directory Structure**: Create src/subscription/, src/display/, src/cli/, bin/, config/
3. **Implement Core Classes**:
   - SymbolSubscription.js (subscription management)
   - TerminalDisplay.js (blessed terminal interface)
   - PriceTable.js (price table rendering)
4. **Create CLI Tools**:
   - bin/subscribe.js (symbol subscription CLI)
   - bin/live-display.js (live price display CLI)

## Key Integration Points
- **stream.js**: Extend to support symbol subscription hooks
- **@reiryoku/ctrader-layer**: Use existing connection for WebSocket messages
- **Environment variables**: Reuse existing .env file, add display settings

## Critical Implementation Details
- **Message Types**: Handle ProtoOASpotEvent messages for tick data
- **Symbol IDs**: Map symbol names to cTrader symbol IDs
- **Terminal Updates**: Use 100ms update interval, prevent screen flicker
- **Error Handling**: Graceful handling of subscription failures

## Testing Requirements
- Test symbol subscription with mock data
- Verify terminal display renders correctly
- Test CLI argument parsing
- Validate integration with existing connection

## File Creation Order
1. Configuration files (config/default-symbols.json, config/display.json)
2. Core subscription classes (src/subscription/)
3. Terminal display classes (src/display/)
4. CLI interfaces (src/cli/)
5. Executable scripts (bin/)

## Dependencies Status
All dependencies specified in task/02_architecture/02_dependencies.md - ready for installation.

## Handoff Status: READY_FOR_CODER
Architecture complete, ready for implementation phase.