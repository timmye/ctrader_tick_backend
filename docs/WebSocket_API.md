# WebSocket API Documentation for cTrader Tick Streamer Backend

## Overview
This document describes the WebSocket API provided by the backend service for real-time cTrader tick data. This API is designed for simplicity and performance, allowing frontend applications to easily subscribe to and receive live price updates.

**WebSocket Endpoint:** The backend WebSocket server binds to the port specified by the `WS_PORT` environment variable (default 8080). In environments like Firebase Studio, this port is typically proxied, and the frontend should connect to a dynamically generated URL (e.g., `wss://your-preview-url/ws`) that routes to this backend port.

## Connection Flow and Status Updates

Upon establishing a WebSocket connection, the frontend should send a `{ "type": "connect" }` message to the backend to signal its readiness and request the current status.

The backend maintains a unified status reflecting both the WebSocket server's state and the cTrader API session's state. It broadcasts status updates to all connected clients whenever the status changes, and also sends the current status to a new client upon receiving their initial `{ "type": "connect" }` message.

### Backend Status States

The `status` field in backend-to-client status messages will be one of the following strings:

*   `disconnected`: The WebSocket server is not running, or the cTrader session is disconnected.
*   `ws-connecting`: The WebSocket server is starting up.
*   `ws-open`: The WebSocket server is running and accepting connections, but the cTrader session is not yet connected.
*   `ctrader-connecting`: The WebSocket is open, and the backend is actively attempting to connect to the cTrader API.
*   `connected`: The WebSocket is open, the cTrader session is successfully connected, authenticated, and available symbols have been loaded.
*   `error`: An unrecoverable error has occurred in the WebSocket server or cTrader session.

## Message Types

All messages exchanged are JSON objects with a `type` field.

### Client → Server Messages

*   **`{ type: 'connect' }`**:
    *   Sent by the frontend after establishing the WebSocket connection to signal readiness and request the current backend status.
    *   Payload: None.

*   **`{ type: 'subscribe', symbols: string[] }`**:
    *   Sent to request subscription to one or more symbols.
    *   The backend will begin streaming `tick` data for these symbols.
    *   The backend only subscribes to the cTrader API for a given symbol if at least one client is interested.
    *   Payload: An array of string symbol names (e.g., `["EURUSD", "XAUUSD"]`). Symbol names should be uppercase.

*   **`{ type: 'unsubscribe', symbols: string[] }`**:
    *   Sent to stop receiving `tick` data for specified symbols.
    *   If no other client is subscribed to a symbol, the backend will also unsubscribe from cTrader, optimizing resource usage.
    *   Payload: An array of string symbol names.

*   **`{ type: 'ping' }`**:
    *   Clients can send a `"ping"` message to check the connection's liveness.
    *   Payload: None.

*   **`{ type: 'getSubscriptions' }`**:
    *   Clients can request their current active subscriptions on the WebSocket server.
    *   Payload: None.

### Server → Client Messages

*   **`{ type: 'status', status: string, availableSymbols: string[], message?: string }`**:
    *   Sent by the backend to report the current overall connection status.
    *   This message is sent to a new client upon receiving their `{ "type": "connect" }` message and broadcast to all clients whenever the backend status changes.
    *   `status`: (string) The current backend status (see Backend Status States above).
    *   `availableSymbols`: (string[]) An array of all symbols available for subscription (loaded from cTrader). This list is populated when the `status` is `connected`.
    *   `message`: (optional string) An optional message providing additional details, particularly for `error` status.

*   **`{ type: 'tick', symbol: string, bid: number, ask: number, spread: number, timestamp: number, ...otherTickData }`**:
    *   Sent for each incoming tick for a subscribed symbol.
    *   `symbol`: (string) The string name of the symbol (e.g., `"EURUSD"`).
    *   `symbolId`: (number) The numeric ID of the symbol from cTrader.
    *   `bid`: (number) The bid price as a floating-point number.
    *   `ask`: (number) The ask price as a floating-point number.
    *   `spread`: (number) The calculated spread (`ask - bid`).
    *   `timestamp`: (number) The timestamp of the tick, generated server-side.
    *   `...otherTickData`: Additional fields may be included depending on the cTrader API data.

*   **`{ type: 'subscribeResponse', results: Array<{ symbol: string, status: 'subscribed' | 'unsubscribed' | 'error', message?: string }> }`**:
    *   Sent in response to a `"subscribe"` message, indicating the status of each requested subscription.
    *   `results`: (array of objects) Each object contains:
        *   `symbol`: (string) The symbol name.
        *   `status`: (`"subscribed"`, `"unsubscribed"`, or `"error"`) The outcome for this symbol.
        *   `message`: (optional string) An error message if `status` is `"error"`.

*   **`{ type: 'unsubscribeResponse', results: Array<{ symbol: string, status: 'unsubscribed' | 'error', message?: string }> }`**:
    *   Sent in response to an `"unsubscribe"` message.
    *   `results`: (array of objects) Similar structure to `subscribeResponse results`.

*   **`{ type: 'pong', timestamp: number }`**:
    *   Sent in response to a client's `"ping"` message.
    *   `timestamp`: (number) The server-side timestamp of the response.

*   **`{ type: 'subscriptions', symbols: string[], timestamp: number }`**:
    *   Sent in response to a client's `"getSubscriptions"` message.
    *   `symbols`: (string[]) An array of symbol names currently subscribed to by that specific client.
    *   `timestamp`: (number) The server-side timestamp of the response.

*   **`{ type: 'error', message: string }`**:
    *   Sent when a general error occurs on the server, not directly tied to a specific request-response cycle (e.g., cTrader API errors, internal server errors, invalid client message format).
    *   `message`: (string) A descriptive error message.

## Environment Variables
The backend relies on the following environment variables, typically set in `ctrader_tick_backend/.env`:

*   `CTRADER_CLIENT_ID`, `CTRADER_CLIENT_SECRET`, `CTRADER_ACCESS_TOKEN`, `CTRADER_ACCOUNT_ID`: Your cTrader API credentials.
*   `HOST`, `PORT`: cTrader API server host and port (e.g., `live.ctraderapi.com`, `5035`).
*   `WS_PORT`: The internal port for the WebSocket server (e.g., `8080`). This can be overridden by IDX's `PORT` environment variable.

## Development and Deployment

### Running Locally (or in IDX)
From the `ctrader_tick_backend` directory:
```bash
npm install
npm start
```

The WebSocket server will start on the configured port and automatically attempt to connect to the cTrader API and load available symbols. It will then wait for frontend clients to connect and subscribe.

### Frontend Integration Considerations

*   **Dynamic Port:** Always retrieve the WebSocket URL dynamically based on the current environment (e.g., `window.location.protocol`, `window.location.host` in a browser). In IDX, `process.env.PORT` from `dev.nix` might override `WS_PORT`.
*   **WebSocket Secure (WSS):** For HTTPS frontends, ensure you use `wss://` for WebSocket connections. IDX automatically handles WSS for preview URLs, and the frontend should use `window.location.protocol` to determine `ws://` or `wss://`.
*   **Vite Proxy:** If using Vite, configure a proxy to forward a specific path (e.g., `/ws`) to your backend WebSocket server during development to avoid CORS issues and simplify URL management. Ensure the proxy handles WebSocket upgrades (`ws: true`).

---

*Note: This document replaces the older `initial api/websocket_api_docs.md`.*