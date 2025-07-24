const WebSocket = require('ws');

class WebSocketServer {
    constructor(port, cTraderSession) {
        this.wss = new WebSocket.Server({ port });
        this.cTraderSession = cTraderSession;
        this.clientSubscriptions = new Map(); // Map: WebSocket -> Set<symbolName>
        this.backendSubscriptions = new Map(); // Map: symbolName -> count of clients

        this.wss.on('connection', (ws) => this.handleConnection(ws));
        this.cTraderSession.on('tick', (tick) => {
            // console.log('WebSocketServer received tick event from CTraderSession:', tick); // Removed log
            this.broadcastTick(tick);
        });

        console.log(`WebSocket server started on port ${port}`);
    }

    handleConnection(ws) {
        console.log('Client connected');
        this.clientSubscriptions.set(ws, new Set());

        // Send initial connection message with available symbols
        if (this.cTraderSession.symbolMap.size > 0) {
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'connected',
                availableSymbols: Array.from(this.cTraderSession.symbolMap.keys()),
                timestamp: Date.now(),
            }));
        } else {
            // If symbols are not yet loaded, wait for them
            this.cTraderSession.once('connected', () => {
                ws.send(JSON.stringify({
                    type: 'connection',
                    status: 'connected',
                    availableSymbols: Array.from(this.cTraderSession.symbolMap.keys()),
                    timestamp: Date.now(),
                }));
            });
        }

        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('close', () => this.handleDisconnect(ws));
        ws.on('error', (error) => console.error('WebSocket error:', error));
    }

    async handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            const clientSubs = this.clientSubscriptions.get(ws);

            switch (data.type) {
                case 'subscribe':
                    // console.log(`Received subscribe request from client for symbols: ${data.symbols}`); // Removed log
                    const symbolsToSubscribe = Array.isArray(data.symbols) ? data.symbols : [data.symbols];
                    const subscribeResults = [];

                    for (const symbolName of symbolsToSubscribe) {
                        if (this.cTraderSession.symbolMap.has(symbolName)) {
                            clientSubs.add(symbolName);
                            this.incrementBackendSubscription(symbolName);
                            subscribeResults.push({ symbol: symbolName, status: 'subscribed' });
                        } else {
                            subscribeResults.push({ symbol: symbolName, status: 'error', message: `Unknown symbol: ${symbolName}` });
                        }
                    }
                    ws.send(JSON.stringify({ type: 'subscribeResponse', results: subscribeResults, timestamp: Date.now() }));
                    break;

                case 'unsubscribe':
                    // console.log(`Received unsubscribe request from client for symbols: ${data.symbols}`); // Removed log
                    const symbolsToUnsubscribe = Array.isArray(data.symbols) ? data.symbols : [data.symbols];
                    const unsubscribeResults = [];

                    for (const symbolName of symbolsToUnsubscribe) {
                        if (clientSubs.has(symbolName)) {
                            clientSubs.delete(symbolName);
                            this.decrementBackendSubscription(symbolName);
                            unsubscribeResults.push({ symbol: symbolName, status: 'unsubscribed' });
                        } else {
                            unsubscribeResults.push({ symbol: symbolName, status: 'error', message: `Not subscribed to ${symbolName}` });
                        }
                    }
                    ws.send(JSON.stringify({ type: 'unsubscribeResponse', results: unsubscribeResults, timestamp: Date.now() }));
                    break;
                
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                case 'getSubscriptions':
                    ws.send(JSON.stringify({ type: 'subscriptions', symbols: Array.from(clientSubs), timestamp: Date.now() }));
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type', timestamp: Date.now() }));
                    break;
            }
        } catch (error) {
            console.error('Failed to parse or handle message:', message, error);
            ws.send(JSON.stringify({ type: 'error', message: `Server error: ${error.message}`, timestamp: Date.now() }));
        }
    }

    async handleDisconnect(ws) {
        console.log('Client disconnected');
        const clientSubs = this.clientSubscriptions.get(ws);
        if (clientSubs) {
            for (const symbolName of clientSubs) {
                this.decrementBackendSubscription(symbolName);
            }
            this.clientSubscriptions.delete(ws);
        }
    }

    async incrementBackendSubscription(symbolName) {
        const currentCount = this.backendSubscriptions.get(symbolName) || 0;
        this.backendSubscriptions.set(symbolName, currentCount + 1);

        if (currentCount === 0) {
            // First client for this symbol, subscribe with cTrader
            await this.cTraderSession.subscribeToSymbols([symbolName]);
        }
    }

    async decrementBackendSubscription(symbolName) {
        const currentCount = this.backendSubscriptions.get(symbolName) || 0;
        if (currentCount > 0) {
            this.backendSubscriptions.set(symbolName, currentCount - 1);
            if (currentCount - 1 === 0) {
                // Last client unsubscribed, unsubscribe from cTrader
                await this.cTraderSession.unsubscribeFromSymbols([symbolName]);
            }
        }
    }

    broadcastTick(tick) {
        // console.log('Broadcasting tick:', tick); // Removed log
        const message = JSON.stringify({ type: 'tick', ...tick });
        this.wss.clients.forEach((client) => {
            // Only send to clients who are subscribed to this specific symbol
            const clientSubs = this.clientSubscriptions.get(client);
            if (client.readyState === WebSocket.OPEN && clientSubs && clientSubs.has(tick.symbol)) {
                client.send(message);
            }
        });
    }
}

module.exports = { WebSocketServer };
