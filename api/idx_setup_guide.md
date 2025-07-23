# Google IDX Setup Guide for WebSocket Tick Streamer

## IDX Compatibility ✅

The WebSocket tick streamer is **fully compatible** with Google IDX with the following considerations:

### Required Changes Made

1. **Dynamic Port Binding**: Uses `process.env.PORT` (IDX requirement)
2. **Host Binding**: Binds to `0.0.0.0` for IDX's networking
3. **Environment Variable Support**: Respects IDX's port assignment

## Package.json Updates Needed

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node websocket-tick-streamer.js",
    "dev": "node websocket-tick-streamer.js",
    "stream": "node stream.js",
    "ws-stream": "node websocket-tick-streamer.js"
  },
  "dependencies": {
    "@reiryoku/ctrader-layer": "^latest",
    "ws": "^8.14.2",
    "dotenv": "^16.3.1",
    "events": "^3.3.0"
  }
}
```

## IDX Development Workflow

### 1. Environment Setup
Your `.env` file should contain:
```env
# cTrader API Credentials
CTRADER_CLIENT_ID=your_client_id
CTRADER_CLIENT_SECRET=your_client_secret
CTRADER_ACCESS_TOKEN=your_access_token
CTRADER_ACCOUNT_ID=your_account_id

# cTrader Connection
HOST=demo.ctraderapi.com
PORT=5035

# WebSocket Server (IDX will override PORT)
WS_PORT=8080
```

### 2. Start the WebSocket Server
```bash
npm run ws-stream
```

### 3. IDX Preview Integration

#### Option A: Separate WebSocket Server
Run the WebSocket streamer in the terminal:
```bash
node websocket-tick-streamer.js
```

The WebSocket will be available at the IDX-provided port.

#### Option B: Integrated with Vite Frontend
Modify your Vite config to proxy WebSocket connections:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
```

## IDX-Specific WebSocket Connection

### Frontend Connection Code for IDX
```javascript
// Get the current IDX preview URL and convert to WebSocket
const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`; // If using Vite proxy
    // OR direct connection to IDX port:
    // return `${protocol}//${host.replace(':3000', ':8080')}`;
};

const ws = new WebSocket(getWebSocketUrl());
```

### React Hook for IDX Environment
```javascript
import { useState, useEffect, useRef } from 'react';

export const useTickStreamer = () => {
    const [ticks, setTicks] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        // IDX-aware WebSocket URL detection
        const getWsUrl = () => {
            if (import.meta.env.DEV) {
                // Development: try to connect to WebSocket server
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const hostname = window.location.hostname;
                const port = import.meta.env.VITE_WS_PORT || '8080';
                return `${protocol}//${hostname}:${port}`;
            } else {
                // Production: use same origin with WebSocket protocol
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                return `${protocol}//${window.location.host}/ws`;
            }
        };

        ws.current = new WebSocket(getWsUrl());
        
        ws.current.onopen = () => {
            console.log('Connected to IDX WebSocket tick streamer');
            setIsConnected(true);
        };
        
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'tick') {
                setTicks(prev => ({
                    ...prev,
                    [data.symbol]: data
                }));
            }
        };
        
        ws.current.onclose = () => {
            setIsConnected(false);
            console.log('IDX WebSocket connection closed');
        };
        
        ws.current.onerror = (error) => {
            console.error('IDX WebSocket error:', error);
        };
        
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const subscribe = (symbols) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'subscribe',
                symbols: Array.isArray(symbols) ? symbols : [symbols]
            }));
        }
    };

    const unsubscribe = (symbols) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'unsubscribe',
                symbols: Array.isArray(symbols) ? symbols : [symbols]
            }));
        }
    };

    return { ticks, isConnected, subscribe, unsubscribe };
};
```

## IDX Development Tips

### 1. Port Management
- IDX assigns dynamic ports via `$PORT` environment variable
- The WebSocket server automatically uses IDX's assigned port
- Frontend should detect the WebSocket URL dynamically

### 2. Networking in IDX
- All servers must bind to `0.0.0.0` (not `localhost`)
- IDX provides secure HTTPS/WSS endpoints automatically
- Use the preview URLs for external access

### 3. Development Workflow
```bash
# Terminal 1: Start WebSocket streamer
npm run ws-stream

# Terminal 2: Start Vite frontend (if separate)
npm run dev

# Or combine both in package.json:
"dev": "concurrently \"npm run ws-stream\" \"vite\""
```

### 4. Environment Variables
IDX automatically provides:
- `PORT`: Dynamic port assignment
- Development environment detection
- Preview URL generation

### 5. Testing in IDX
```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:$PORT/
```

## Troubleshooting in IDX

### Common Issues

1. **WebSocket Connection Failed**
   - Check if WebSocket server is running on correct port
   - Verify `0.0.0.0` host binding
   - Check IDX preview URL

2. **Port Conflicts**
   - IDX manages ports automatically
   - Don't hardcode port numbers
   - Use `process.env.PORT`

3. **CORS Issues**
   - Not typically an issue in IDX
   - IDX handles CORS for preview URLs

4. **cTrader API Connection**
   - Verify `.env` file is present
   - Check cTrader API credentials
   - Ensure demo/live API endpoint is correct

### Debug Commands
```bash
# Check environment variables
env | grep PORT

# Test WebSocket server
node -e "console.log('Port:', process.env.PORT || 'Not set');"

# Verify dependencies
npm list ws @reiryoku/ctrader-layer
```

## Production Deployment from IDX

When deploying to production:

1. **Environment Variables**: Set production cTrader credentials
2. **Port Configuration**: Remove IDX-specific port handling
3. **Host Binding**: May need to adjust for production environment
4. **SSL/TLS**: Ensure WebSocket Secure (WSS) for HTTPS sites

The code is ready for both IDX development and production deployment! 🚀