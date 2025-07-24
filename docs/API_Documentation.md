# WebSocket API Documentation for cTrader Tick Streamer

## Overview
This document describes the WebSocket API provided by the backend service for real-time cTrader tick data. This API is designed for simplicity and performance, allowing frontend applications to easily subscribe to and receive live price updates.

**WebSocket Endpoint:** `ws://localhost:8080` (The port is dynamically assigned by IDX via `process.env.PORT` and typically proxied by the frontend development server).

## Connection Flow

### 1. Initial Connection
Upon a successful WebSocket connection, the client will receive an initial message (once the cTrader session is authenticated and symbols are loaded):

```json
{
  "type": "connection",
  "status": "connected",
  "clientId": "client_timestamp_randomId",
  "availableSymbols": ["EURUSD", "GBPUSD", "USDJPY", ...],
  "timestamp": 1690123456789
}
```

- `type`: `"connection"`
- `status`: `"connected"`
- `clientId`: A unique identifier for the connected client.
- `availableSymbols`: An array of all symbols available for subscription (loaded from cTrader). This list is crucial for frontend clients to know what they can subscribe to.
- `timestamp`: The server-side timestamp of the message.

## Message Types

### Client → Server Messages

All messages sent from the client to the server must be JSON objects with a `type` field.

#### 1. Subscribe to Symbols
Clients send this message to subscribe to one or more symbols. The server will begin streaming tick data for these symbols. The backend will only subscribe to the cTrader API for a given symbol if at least one client is interested.

```json
{
  "type": "subscribe",
  "symbols": ["EURUSD", "GBPUSD"]
}
```

- `type`: `"subscribe"`
- `symbols`: An array of string symbol names (e.g., `["EURUSD", "XAUUSD"]`). Symbol names should be uppercase.

#### 2. Unsubscribe from Symbols
Clients send this message to stop receiving tick data for specified symbols. If no other client is subscribed to a symbol, the backend will also unsubscribe from cTrader, optimizing resource usage.

```json
{
  "type": "unsubscribe",
  "symbols": ["EURUSD"]
}
```

- `type`: `"unsubscribe"`
- `symbols`: An array of string symbol names.

#### 3. Ping (Heartbeat)
Clients can send a `"ping"` message to check the connection's liveness. The server will respond with a `"pong"`.

```json
{
  "type": "ping"
}
```

- `type`: `"ping"`

#### 4. Get Current Subscriptions
Clients can request their current active subscriptions on the WebSocket server.

```json
{
  "type": "getSubscriptions"
}
```

- `type`: `"getSubscriptions"`

### Server → Client Messages

All messages sent from the server to the client are JSON objects with a `type` field.

#### 1. Tick Data (Real-time Price Updates)
This is the primary message for live price updates. Sent for each subscribed symbol whenever a new tick is received from cTrader.

```json
{
  "type": "tick",
  "symbol": "EURUSD",
  "symbolId": 1, // cTrader's internal symbol ID
  "bid": 1.09245, // Bid price (converted to float)
  "ask": 1.09248, // Ask price (converted to float)
  "spread": 0.00003, // Calculated spread (ask - bid)
  "timestamp": 1690123456789 // Server-side timestamp of the tick
}
```

- `type`: `"tick"`
- `symbol`: The string name of the symbol (e.g., `"EURUSD"`).
- `symbolId`: The numeric ID of the symbol from cTrader.
- `bid`: The bid price as a floating-point number.
- `ask`: The ask price as a floating-point number.
- `spread`: The calculated spread (`ask - bid`).
- `timestamp`: The timestamp of the tick, generated server-side.

#### 2. Subscription Response
Sent in response to a `"subscribe"` message, indicating the status of each requested subscription.

```json
{
  "type": "subscribeResponse",
  "results": [
    { "symbol": "EURUSD", "status": "subscribed" },
    { "symbol": "INVALID", "status": "error", "message": "Unknown symbol: INVALID" }
  ],
  "timestamp": 1690123456789
}
```

- `type`: `"subscribeResponse"`
- `results`: An array of objects, each containing:
    - `symbol`: The symbol name.
    - `status`: `"subscribed"` or `"error"`.
    - `message`: (Optional) An error message if `status` is `"error"`.
- `timestamp`: The server-side timestamp of the response.

#### 3. Unsubscription Response
Sent in response to an `"unsubscribe"` message, indicating the status of each requested unsubscription.

```json
{
  "type": "unsubscribeResponse",
  "results": [
    { "symbol": "EURUSD", "status": "unsubscribed" }
  ],
  "timestamp": 1690123456789
}
```

- `type`: `"unsubscribeResponse"`
- `results`: An array of objects, each containing:
    - `symbol`: The symbol name.
    - `status`: `"unsubscribed"` or `"error"`.
    - `message`: (Optional) An error message if `status` is `"error"`.
- `timestamp`: The server-side timestamp of the response.

#### 4. Pong Response
Sent in response to a client's `"ping"` message.

```json
{
  "type": "pong",
  "timestamp": 1690123456789
}
```

- `type`: `"pong"`
- `timestamp`: The server-side timestamp of the response.

#### 5. Current Subscriptions
Sent in response to a client's `"getSubscriptions"` message.

```json
{
  "type": "subscriptions",
  "symbols": ["EURUSD", "GBPUSD"],
  "timestamp": 1690123456789
}
```

- `type`: `"subscriptions"`
- `symbols`: An array of symbol names currently subscribed to by that specific client.
- `timestamp`: The server-side timestamp of the response.

#### 6. Error Message
Sent when a general error occurs on the server, not directly tied to a specific request-response cycle (e.g., cTrader API errors, internal server errors, invalid client message format).

```json
{
  "type": "error",
  "message": "Detailed error description here.",
  "timestamp": 1690123456789
}
```

- `type`: `"error"`
- `message`: A descriptive error message.
- `timestamp`: The server-side timestamp of the error.

## Symbol IDs

The backend automatically fetches and manages symbol IDs. Frontend clients should primarily use uppercase symbol names (e.g., "EURUSD") for subscribe/unsubscribe requests. The `symbolId` is included in tick data for reference.

## Environment Variables
The backend relies on the following environment variables, typically set in `ctrader_tick_backend/.env`:

```env
CTRADER_CLIENT_ID=your_client_id
CTRADER_CLIENT_SECRET=your_client_secret
CTRADER_ACCESS_TOKEN=your_access_token
CTRADER_ACCOUNT_ID=your_account_id
HOST=live.ctraderapi.com
PORT=5035
WS_PORT=8080 # This is the internal port. IDX will provide a dynamic external PORT.
CTRADER_SYMBOL_IDS= # This is no longer used for initial subscriptions. Remove or leave empty.
```

## Development and Deployment

### Running Locally (or in IDX)
From the `ctrader_tick_backend` directory:
```bash
npm install
npm start
```

The WebSocket server will start on `process.env.WS_PORT` (default 8080) or the port assigned by IDX. It will load all available symbols from cTrader upon successful connection and wait for client subscription requests.

### Frontend Integration Considerations

*   **Dynamic Port:** Always retrieve the WebSocket URL dynamically based on the current environment (e.g., `window.location.protocol`, `window.location.host` in a browser). In IDX, `process.env.PORT` from `dev.nix` might override `WS_PORT`.
*   **WebSocket Secure (WSS):** For HTTPS frontends, ensure you use `wss://` for WebSocket connections. IDX automatically handles WSS for preview URLs.
*   **Vite Proxy:** If using Vite, configure a proxy to forward `/ws` requests to your backend WebSocket server during development to avoid CORS issues and simplify URL management.

---