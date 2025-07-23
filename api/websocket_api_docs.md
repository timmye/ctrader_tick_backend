# WebSocket Tick Streamer API Documentation

## Overview
The WebSocket Tick Streamer provides real-time forex tick data from cTrader Open API to frontend applications via WebSocket connections.

**WebSocket Endpoint:** `ws://localhost:8080` (configurable)

## Connection Flow

### 1. Initial Connection
When a client connects, they receive a welcome message:
```json
{
  "type": "connection",
  "status": "connected",
  "clientId": "client_1690123456789_abc123def",
  "availableSymbols": ["EURUSD", "GBPUSD", "USDJPY", ...],
  "timestamp": 1690123456789
}
```

### 2. Client Authentication
No additional authentication required - connection is established automatically.

## Message Types

### Client → Server Messages

#### Subscribe to Symbols
```json
{
  "type": "subscribe",
  "symbols": ["EURUSD", "GBPUSD", "USDJPY"]
}
```

#### Unsubscribe from Symbols
```json
{
  "type": "unsubscribe",
  "symbols": ["EURUSD"]
}
```

#### Ping (Heartbeat)
```json
{
  "type": "ping"
}
```

#### Get Current Subscriptions
```json
{
  "type": "getSubscriptions"
}
```

### Server → Client Messages

#### Tick Data (Real-time Price Updates)
```json
{
  "type": "tick",
  "symbol": "EURUSD",
  "symbolId": 1,
  "bid": "1.09245",
  "ask": "1.09248",
  "spread": "0.00003",
  "timestamp": 1690123456789
}
```

#### Subscribe Response
```json
{
  "type": "subscribeResponse",
  "results": [
    { "symbol": "EURUSD", "status": "subscribed" },
    { "symbol": "GBPUSD", "status": "subscribed" },
    { "symbol": "INVALID", "status": "error", "message": "Unknown symbol: INVALID" }
  ],
  "timestamp": 1690123456789
}
```

#### Unsubscribe Response
```json
{
  "type": "unsubscribeResponse",
  "results": [
    { "symbol": "EURUSD", "status": "unsubscribed" }
  ],
  "timestamp": 1690123456789
}
```

#### Pong Response
```json
{
  "type": "pong",
  "timestamp": 1690123456789
}
```

#### Current Subscriptions
```json
{
  "type": "subscriptions",
  "symbols": ["EURUSD", "GBPUSD"],
  "timestamp": 1690123456789
}
```

#### Error Messages
```json
{
  "type": "error",
  "message": "Unknown symbol: INVALID",
  "timestamp": 1690123456789
}
```

## Available Symbols

| Symbol  | ID | Description |
|---------|----|-----------  |
| EURUSD  | 1  | Euro / US Dollar |
| GBPUSD  | 2  | British Pound / US Dollar |
| USDJPY  | 3  | US Dollar / Japanese Yen |
| USDCHF  | 4  | US Dollar / Swiss Franc |
| AUDUSD  | 5  | Australian Dollar / US Dollar |
| USDCAD  | 6  | US Dollar / Canadian Dollar |
| NZDUSD  | 7  | New Zealand Dollar / US Dollar |
| EURGBP  | 8  | Euro / British Pound |
| EURJPY  | 9  | Euro / Japanese Yen |
| GBPJPY  | 10 | British Pound / Japanese Yen |
| AUDCAD  | 11 | Australian Dollar / Canadian Dollar |
| AUDCHF  | 12 | Australian Dollar / Swiss Franc |
| AUDJPY  | 13 | Australian Dollar / Japanese Yen |
| AUDNZD  | 14 | Australian Dollar / New Zealand Dollar |
| CADCHF  | 15 | Canadian Dollar / Swiss Franc |
| CADJPY  | 16 | Canadian Dollar / Japanese Yen |
| CHFJPY  | 17 | Swiss Franc / Japanese Yen |
| EURAUD  | 18 | Euro / Australian Dollar |
| EURCAD  | 19 | Euro / Canadian Dollar |
| EURCHF  | 20 | Euro / Swiss Franc |
| EURNZD  | 21 | Euro / New Zealand Dollar |
| GBPAUD  | 22 | British Pound / Australian Dollar |
| GBPCAD  | 23 | British Pound / Canadian Dollar |
| GBPCHF  | 24 | British Pound / Swiss Franc |
| GBPNZD  | 25 | British Pound / New Zealand Dollar |
| NZDCAD  | 26 | New Zealand Dollar / Canadian Dollar |
| NZDCHF  | 27 | New Zealand Dollar / Swiss Franc |
| NZDJPY  | 28 | New Zealand Dollar / Japanese Yen |

## Frontend Integration Examples

### JavaScript/HTML Example
```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = function() {
    console.log('Connected to tick streamer');
    
    // Subscribe to multiple symbols
    ws.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['EURUSD', 'GBPUSD', 'USDJPY']
    }));
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'connection':
            console.log('Welcome:', data);
            break;
            
        case 'tick':
            console.log(`${data.symbol}: ${data.bid}/${data.ask}`);
            updatePriceDisplay(data);
            break;
            
        case 'subscribeResponse':
            console.log('Subscription results:', data.results);
            break;
            
        case 'error':
            console.error('Error:', data.message);
            break;
    }
};

function updatePriceDisplay(tick) {
    const element = document.getElementById(tick.symbol);
    if (element) {
        element.innerHTML = `
            <div class="symbol">${tick.symbol}</div>
            <div class="prices">
                <span class="bid">${tick.bid}</span>
                <span class="ask">${tick.ask}</span>
            </div>
            <div class="spread">${tick.spread}</div>
        `;
    }
}
```

### React Hook Example
```javascript
import { useState, useEffect, useRef } from 'react';

export const useTickStreamer = (url = 'ws://localhost:8080') => {
    const [ticks, setTicks] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [subscriptions, setSubscriptions] = useState(new Set());
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
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
        };
        
        return () => {
            ws.current?.close();
        };
    }, [url]);

    const subscribe = (symbols) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'subscribe',
                symbols: Array.isArray(symbols) ? symbols : [symbols]
            }));
            
            symbols.forEach(symbol => {
                setSubscriptions(prev => new Set([...prev, symbol]));
            });
        }
    };

    const unsubscribe = (symbols) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
                type: 'unsubscribe',
                symbols: Array.isArray(symbols) ? symbols : [symbols]
            }));
            
            symbols.forEach(symbol => {
                setSubscriptions(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(symbol);
                    return newSet;
                });
            });
        }
    };

    return {
        ticks,
        isConnected,
        subscriptions: Array.from(subscriptions),
        subscribe,
        unsubscribe
    };
};
```

### Vue.js Composable Example
```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useTickStreamer(url = 'ws://localhost:8080') {
    const ticks = ref({});
    const isConnected = ref(false);
    const subscriptions = ref(new Set());
    let ws = null;

    const connect = () => {
        ws = new WebSocket(url);
        
        ws.onopen = () => {
            isConnected.value = true;
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'tick') {
                ticks.value[data.symbol] = data;
            }
        };
        
        ws.onclose = () => {
            isConnected.value = false;
        };
    };

    const subscribe = (symbols) => {
        if (ws?.readyState === WebSocket.OPEN) {
            const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
            
            ws.send(JSON.stringify({
                type: 'subscribe',
                symbols: symbolArray
            }));
            
            symbolArray.forEach(symbol => {
                subscriptions.value.add(symbol);
            });
        }
    };

    const unsubscribe = (symbols) => {
        if (ws?.readyState === WebSocket.OPEN) {
            const symbolArray = Array.isArray(symbols) ? symbols : [symbols];
            
            ws.send(JSON.stringify({
                type: 'unsubscribe',
                symbols: symbolArray
            }));
            
            symbolArray.forEach(symbol => {
                subscriptions.value.delete(symbol);
            });
        }
    };

    onMounted(connect);
    
    onUnmounted(() => {
        ws?.close();
    });

    return {
        ticks,
        isConnected,
        subscriptions: computed(() => Array.from(subscriptions.value)),
        subscribe,
        unsubscribe
    };
}
```

## Error Handling

### Connection Errors
- **WebSocket Connection Failed**: Check if the server is running on the correct port
- **Authentication Failed**: Verify cTrader API credentials in `.env` file
- **Symbol Not Found**: Use only symbols from the available symbols list

### Message Validation
- All messages must be valid JSON
- Required fields must be present
- Symbol names are case-insensitive but will be returned in uppercase

## Performance Considerations

### Client-Side
- Implement throttling for rapid price updates if needed
- Use efficient data structures for storing tick data
- Consider using Web Workers for heavy processing

### Server-Side
- Automatic cleanup of unused subscriptions
- Efficient broadcasting to multiple clients
- Memory management for client connections

## Monitoring & Debugging

### Health Check
The server logs key events:
- Client connections/disconnections
- Symbol subscriptions/unsubscriptions
- cTrader API connection status
- Error conditions

### Debug Mode
Set environment variable `DEBUG=true` for verbose logging.

## Rate Limits
- No artificial rate limits imposed
- Limited by cTrader API's natural tick frequency
- WebSocket connection limits depend on server resources

## Security Notes
- No authentication required for demo purposes
- In production, implement proper authentication
- Consider rate limiting and connection limits
- Validate all incoming messages