












































































































































# Backend Architecture Documentation for cTrader Tick Streamer

## Overview
This document describes the architecture of the real-time cTrader Tick Streamer backend. The primary goal of this service is to provide a lean, high-performance, and reliable conduit for cTrader Open API tick data to various frontend applications. It prioritizes simplicity, maintainability, and efficient resource utilization.

## Core Principles

*   **Modularity:** Clear separation of concerns into distinct modules.
*   **Event-Driven:** Components communicate primarily through events, promoting decoupling.
*   **Resilience:** Built-in mechanisms for reconnection and graceful error handling.
*   **Performance:** Designed for high-throughput data streaming with minimal overhead, particularly with dynamic subscription management.
*   **Simplicity:** Easy to understand, debug, and extend.

## High-Level Architecture

The backend service comprises three main layers:

1.  **cTrader Communication Layer (cTrader-Layer):** Handles the low-level cTrader Open API protocol. This is the forked and fixed `@reiryoku/ctrader-layer` library.
2.  **cTrader Session Management Layer (CTraderSession):** Manages the application-level logic for the cTrader connection, authentication, heartbeats, and a comprehensive list of all available symbols.
3.  **WebSocket Server Layer (WebSocketServer):** Provides the external interface for frontend clients to subscribe to and receive tick data, dynamically managing cTrader API subscriptions based on client demand.

```mermaid
graph TD
    subgraph Frontend Applications
        F1[Browser Client 1]
        F2[Browser Client 2]
        F3[Mobile App]
    end

    subgraph Backend Service
        direction LR
        WS[WebSocketServer]
        CTS[CTraderSession]
        CTL(cTrader-Layer - Fixed Fork)
    end

    subgraph cTrader Open API
        CAPI(cTrader Live API)
    end

    F1 --- WS
    F2 --- WS
    F3 --- WS

    WS <--> CTS
    CTS <--> CTL
    CTL <--> CAPI

    style F1 fill:#add8e6,stroke:#333,stroke-width:2px
    style F2 fill:#add8e6,stroke:#333,stroke-width:2px
    style F3 fill:#add8e6,stroke:#333,stroke-width:2px
    style WS fill:#b3e0ff,stroke:#333,stroke-width:2px
    style CTS fill:#ccffe6,stroke:#333,stroke-width:2px
    style CTL fill:#ffccff,stroke:#333,stroke-width:2px
    style CAPI fill:#ffcccc,stroke:#333,stroke-width:2px
```

## Component Breakdown

### 1. `cTrader-Layer` (Forked Library - `ctrader_tick_backend/cTrader-Layer/`) 
This is the patched version of the `@reiryoku/ctrader-layer` NPM package. It's responsible for:

*   **TLS Connection:** Establishing and maintaining a secure TLS socket connection to cTrader.
*   **Protocol Encoding/Decoding:** Handling the low-level protobuf serialization and deserialization of cTrader messages.
*   **Message Dispatching:** Emitting events (by numeric `payloadType`) for incoming cTrader messages.
*   **Bug Fixes:** Contains the critical fixes that enable correct `payloadType` resolution for both sending commands (PascalCase names) and listening to events (SCREAMING\_SNAKE\_CASE enum names).

**Key Files:**
*   `build/entry/node/main.js`: The main entry point for the compiled library.
*   `src/core/protobuf/CTraderProtobufReader.ts`: Contains the `resolveIdentifierToPayloadType` method, which is the core of our fix, correctly mapping string identifiers to numeric payload types.
*   `src/core/CTraderConnection.ts`: Manages the raw socket connection and uses `CTraderProtobufReader` for message handling.

### 2. `CTraderSession` (`ctrader_tick_backend/CTraderSession.js`) 
This module wraps the `cTrader-Layer` and provides application-level logic for interacting with the cTrader API.

**Responsibilities:**
*   **Authentication:** Handles the `ProtoOAApplicationAuthReq` and `ProtoOAAccountAuthReq` flow.
*   **Heartbeats:** Sends `ProtoHeartbeatEvent` messages periodically to keep the connection alive (configurable interval).
*   **Reconnection Logic:** Implements exponential backoff (or similar) to attempt reconnection if the cTrader connection drops.
*   **Comprehensive Symbol Listing:** Fetches and maintains a complete list of all tradable symbols from cTrader (name-to-ID mappings).
*   **Subscription Management:** Manages `ProtoOASubscribeSpotsReq` and `ProtoOAUnsubscribeSpotsReq` requests directly to cTrader based on calls from `WebSocketServer`.
*   **Event Emission:** Emits high-level events (`'tick'`, `'connected'`, `'disconnected'`) that are consumed by the `WebSocketServer`.

**Key Interactions:**
*   Communicates directly with the `cTrader-Layer` using its `sendCommand` method and listens to its raw `payloadType` events.
*   Reads cTrader API credentials from `process.env`.

### 3. `WebSocketServer` (`ctrader_tick_backend/WebSocketServer.js`) 
This module is responsible for handling all client-facing WebSocket communications and intelligently managing backend subscriptions.

**Responsibilities:**
*   **Client Management:** Manages connected WebSocket clients and their individual subscription sets.
*   **Dynamic Backend Subscriptions:** Aggregates client subscription requests. It only subscribes to a symbol from `CTraderSession` (and thus cTrader) if at least one client is actively subscribed to it. It unsubscribes from `CTraderSession` when the last client interested in a symbol disconnects or unsubscribes.
*   **Initial State Broadcast:** Upon a new client connection, sends a `"connection"` message containing the list of `availableSymbols` (obtained from `CTraderSession`).
*   **Tick Broadcasts:** Receives `tick` events from `CTraderSession` and efficiently broadcasts them *only* to relevant subscribed clients.
*   **Client Commands:** Processes `"subscribe"`, `"unsubscribe"`, `"ping"`, and `"getSubscriptions"` messages from frontend clients.
*   **Dynamic Port:** Binds to `process.env.PORT` (or a fallback), compatible with IDX's dynamic port assignment.

**Key Interactions:**
*   Listens for high-level events (`'tick'`) emitted by `CTraderSession`.
*   Sends `subscribeToSymbols` and `unsubscribeFromSymbols` commands to `CTraderSession` based on aggregated client requests.

### 4. Main Application (`ctrader_tick_backend/server.js`) 
This is the entry point of the backend service. It orchestrates the startup and shutdown of the other modules.

**Responsibilities:**
*   **Initialization:** Instantiates `CTraderSession` and `WebSocketServer`.
*   **Startup Flow:** Initiates the connection process for `CTraderSession`.
*   **Process Management:** Handles `SIGINT` for graceful shutdown, ensuring all connections are properly closed.

## Data Flow

1.  `server.js` starts, instantiating `CTraderSession` and `WebSocketServer`.
2.  `CTraderSession` connects to `cTrader-Layer`, which establishes a TLS connection to cTrader API.
3.  `CTraderSession` authenticates with cTrader API using credentials from `.env`.
4.  `CTraderSession` loads all `availableSymbols` from cTrader and starts sending heartbeats. It emits a `'connected'` event.
5.  Frontend clients connect to `WebSocketServer`.
6.  `WebSocketServer` sends `"connection"` message to new clients with `availableSymbols` list.
7.  Frontend clients send `"subscribe"` messages to `WebSocketServer` for desired symbols (e.g., EURUSD, GBPUSD).
8.  `WebSocketServer` updates its internal `clientSubscriptions` and `backendSubscriptions` counts. If a symbol's count goes from 0 to 1, `WebSocketServer` tells `CTraderSession` to subscribe to that symbol.
9.  `CTraderSession` sends `ProtoOASubscribeSpotsReq` to `cTrader-Layer`, which forwards it to cTrader API.
10. cTrader API starts streaming `PROTO_OA_SPOT_EVENT` messages to `cTrader-Layer`.
11. `cTrader-Layer` decodes `PROTO_OA_SPOT_EVENT` and emits it (by its numeric ID).
12. `CTraderSession` listens for these events, processes them into a cleaner `tick` object (calculating spread, converting prices), and emits its own `'tick'` event.
13. `WebSocketServer` listens for `CTraderSession`'s `'tick'` events.
14. `WebSocketServer` broadcasts the `tick` data *only* to clients in its `clientSubscriptions` that are subscribed to that specific symbol.
15. When a client sends `"unsubscribe"`, `WebSocketServer` decrements the symbol's `backendSubscriptions` count. If the count reaches 0, `WebSocketServer` tells `CTraderSession` to unsubscribe from that symbol with cTrader API.

## Error Handling & Resilience

*   **cTrader Connection:** `CTraderSession` includes automatic reconnection logic with a delay on unexpected disconnections or authentication failures, ensuring the backend tries to recover.
*   **API Errors:** `CTraderSession` logs errors received from the cTrader API (e.g., `CH_CLIENT_AUTH_FAILURE`), providing visibility into issues with the cTrader connection itself.
*   **WebSocket Errors:** `WebSocketServer` logs client-side WebSocket errors, helping diagnose frontend connection problems.
*   **Graceful Shutdown:** `server.js` handles `SIGINT` to ensure `CTraderSession` and `WebSocketServer` are properly closed, preventing dangling connections.

## Configuration

Environment variables are used for configuration, stored in `ctrader_tick_backend/.env`:

*   `CTRADER_CLIENT_ID`, `CTRADER_CLIENT_SECRET`, `CTRADER_ACCESS_TOKEN`, `CTRADER_ACCOUNT_ID`: Your cTrader API credentials.
*   `HOST`, `PORT`: cTrader API server host and port (e.g., `live.ctraderapi.com`, `5035`).
*   `WS_PORT`: The internal port for the WebSocket server (e.g., `8080`). This can be overridden by IDX's `PORT` environment variable.
*   `CTRADER_SYMBOL_IDS`: This variable is **no longer used** for initial subscriptions as subscriptions are now client-driven. It can be removed or left empty.

## Dependencies

*   `@reiryoku/ctrader-layer`: Our locally fixed version for robust cTrader API communication.
*   `ws`: For efficient WebSocket server functionality.
*   `dotenv`: For securely loading environment variables.
*   `events`: Node.js built-in for event handling.

## Development & Deployment Notes

*   **IDX Compatibility:** The backend is designed to be fully compatible with IDX, utilizing `process.env.PORT` for dynamic port assignment and binding to `0.0.0.0` for container accessibility.
*   **Production Deployment:** For production, ensure environment variables are managed securely (e.g., Kubernetes secrets, cloud environment variables) and consider using a process manager (e.g., PM2) for continuous operation and automatic restarts.

---