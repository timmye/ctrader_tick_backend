# Web Frontend Development Plan - Live Tick Display

## Phase 1: Foundation Setup
**Priority: Critical**

### Task 1.1: Create Web Directory Structure
```powershell
New-Item -ItemType Directory -Path "web"
New-Item -ItemType Directory -Path "web/public"
New-Item -ItemType Directory -Path "web/src"
```

### Task 1.2: Install Web Dependencies
```powershell
cd web
npm init -y
npm install express@^4.18.2 ws@^8.13.0 cors@^2.8.5 serve-static@^1.15.0
```

### Task 1.3: Environment Configuration
Create `web/.env`:
```
WEB_PORT=3000
WEB_HOST=localhost
MAX_SYMBOLS=24
TICK_BATCH_MS=100
```

## Phase 2: Server-Side Components
**Priority: High**

### Task 2.1: WebSocket Bridge
**File**: `web/src/WebSocketBridge.js`
**Purpose**: Connect cTrader ticks to browser clients
**Key Functions**:
- `createBridge(connection, wss)` - Main bridge factory
- `broadcastTick(tickData)` - Send ticks to all clients
- `handleClientSubscription(symbols)` - Manage symbol subscriptions

### Task 2.2: Express Server
**File**: `web/server.js`
**Purpose**: Static file server + WebSocket endpoint
**Key Functions**:
- `startServer(port)` - Start HTTP/WebSocket server
- `loadSymbols()` - Cache available symbols
- `handleWebSocketConnection(ws)` - Client connection handler

## Phase 3: Client-Side Components
**Priority: High**

### Task 3.1: HTML Structure
**File**: `web/public/index.html`
**Requirements**:
- 4x6 grid layout (24 symbols max)
- Symbol selector dropdown
- Real-time price display
- Connection status indicator

### Task 3.2: Client JavaScript
**File**: `web/public/app.js`
**Key Functions**:
- `connectWebSocket()` - Establish WebSocket connection
- `subscribeToSymbols(symbols)` - Send subscription requests
- `updatePriceDisplay(tickData)` - Update DOM elements
- `createSymbolGrid()` - Generate 4x6 grid
- `handleSymbolSelection()` - Manage symbol choices

### Task 3.3: Styling
**File**: `web/public/styles.css`
**Requirements**:
- Responsive 4x6 grid
- Real-time price animations
- Connection status styling
- Symbol selector styling

## Phase 4: Integration & Testing
**Priority: Medium**

### Task 4.1: Symbol Integration
**File**: `web/public/symbols.json`
**Purpose**: Cache available symbols from cTrader
**Format**: `{"symbols": ["USDJPY", "EURUSD", ...]}`

### Task 4.2: Package.json Scripts
**File**: `web/package.json`
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js --dev",
    "symbols": "node scripts/load-symbols.js"
  }
}
```

## Phase 5: Performance Optimization
**Priority: Low**

### Task 5.1: Tick Batching
**Implementation**: Batch ticks every 100ms before sending to clients

### Task 5.2: Memory Management
**Implementation**: Limit to 100 ticks per symbol in browser memory

### Task 5.3: Connection Management
**Implementation**: Auto-reconnect with exponential backoff

## Development Order
1. **Day 1**: Phase 1 + Phase 2.1 (WebSocket Bridge)
2. **Day 2**: Phase 2.2 + Phase 3.1 (Server + HTML)
3. **Day 3**: Phase 3.2 + Phase 3.3 (Client logic + styling)
4. **Day 4**: Phase 4 (Integration + testing)
5. **Day 5**: Phase 5 (Performance optimization)

## Testing Checklist
- [ ] WebSocket connection established
- [ ] Symbol subscription working
- [ ] Real-time tick display
- [ ] Symbol selection (up to 24)
- [ ] Connection auto-reconnect
- [ ] Memory usage within limits
- [ ] Cross-browser compatibility

## PowerShell Development Commands
```powershell
# Start development
cd web
npm run dev

# Test symbols loading
npm run symbols

# Access application
Start-Process "http://localhost:3000"
```

## Error Handling Requirements
- WebSocket connection failures
- cTrader API disconnections
- Invalid symbol selections
- Browser memory limits
- Network timeouts