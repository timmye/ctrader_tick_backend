# Web Frontend Architecture - Live Tick Display

## Minimal Architecture Design

### Core Components
1. **Express.js Server** - Serves static files + WebSocket endpoint
2. **WebSocket Bridge** - Connects cTrader ticks to browser
3. **Static HTML/JS** - Client-side display with symbol selection
4. **SymbolSubscription** - Reused from existing codebase

### File Structure
```
web/
├── server.js              # Express + WebSocket server
├── public/
│   ├── index.html         # Single page application
│   ├── app.js            # Client-side logic
│   ├── styles.css        # Minimal styling
│   └── symbols.json      # Available symbols cache
├── src/
│   └── WebSocketBridge.js # Server-side tick bridge
└── package.json          # Web dependencies
```

### Dependencies (Minimal)
```json
{
  "express": "^4.18.2",
  "ws": "^8.13.0",
  "cors": "^2.8.5",
  "serve-static": "^1.15.0"
}
```

### Data Flow
```
cTrader API → SymbolSubscription → WebSocketBridge → Browser → Display
```

### WebSocket Message Format
```javascript
// Server → Client
{
  type: 'tick',
  symbol: 'USDJPY',
  bid: 150.123,
  ask: 150.125,
  timestamp: '2024-01-01T12:00:00.000Z'
}

// Client → Server
{
  type: 'subscribe',
  symbols: ['USDJPY', 'EURUSD']
}
```

### Client Architecture
- **Single HTML file** with embedded CSS/JS
- **Vanilla JavaScript** - no frameworks
- **Grid layout** - 4x6 grid for 24 symbols
- **WebSocket auto-reconnect** - handles connection drops
- **Symbol browser** - searchable dropdown

### Server Architecture
- **Express static server** - serves public folder
- **WebSocket endpoint** - `/ws` for real-time ticks
- **Symbol caching** - loads available symbols on startup
- **Connection management** - handles multiple clients

### Performance Optimizations
- **Tick batching** - send ticks in 100ms batches
- **Symbol filtering** - server-side filtering before broadcast
- **Memory limits** - max 100 ticks per symbol in browser
- **Connection pooling** - reuse cTrader connections

### Security Considerations
- **CORS enabled** - for local development
- **No authentication** - relies on server-side cTrader auth
- **Rate limiting** - max 1 subscription change per second
- **Input validation** - validate symbol names

### Environment Variables
```
.env
WEB_PORT=5000
WEB_HOST=localhost
MAX_SYMBOLS=24
TICK_BATCH_MS=100
```

### PowerShell Commands
```powershell
# Install web dependencies
npm install express ws cors serve-static

# Start web server
npm run web

# Development mode
npm run web-dev
```

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+