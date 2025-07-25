const WebSocket = require('ws');

class WebSocketServer {
    constructor(port, cTraderSession) {
        this.wss = new WebSocket.Server({ port });
        this.cTraderSession = cTraderSession;
        this.clientSubscriptions = new Map(); // Map: WebSocket -> Set<symbolName>
        this.backendSubscriptions = new Map(); // Map: symbolName -> count of clients

        this.wss.on('connection', (ws) => this.handleConnection(ws));
        
        this.cTraderSession.on('tick', (tick) => this.broadcastTick(tick));
        this.cTraderSession.on('status', (status) => this.broadcastStatus(status));

        console.log(`WebSocket server started on port ${port}`);
    }

    handleConnection(ws) {
        console.log('Client connected');
        this.clientSubscriptions.set(ws, new Set());

        // Send the current connection status immediately
        const currentStatus = this.cTraderSession.getStatus();
        const message = {
            type: 'status',
            status: currentStatus,
            timestamp: Date.now(),
        };

        // If connected, also provide the list of available symbols
        if (currentStatus === 'connected') {
            message.availableSymbols = Array.from(this.cTraderSession.symbolMap.keys());
        }
        ws.send(JSON.stringify(message));

        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('close', () => this.handleDisconnect(ws));
        ws.on('error', (error) => console.error('WebSocket error:', error));
    }

    async handleMessage(ws, message) {
        console.log('Received message from client:', message.toString()); // Added for diagnostics
        try {
            const data = JSON.parse(message);
            const clientSubs = this.clientSubscriptions.get(ws);

            switch (data.type) {
                case 'connect':
                    console.log('Received "connect" request from client.');
                    this.cTraderSession.connect(); // Fire-and-forget; status is broadcast by events
                    break;
                
                case 'disconnect':
                    console.log('Received "disconnect" request from client.');
                    this.cTraderSession.disconnect();
                    break;
                
                case 'status':
                    ws.send(JSON.stringify({
                        type: 'status',
                        status: this.cTraderSession.getStatus(),
                        timestamp: Date.now()
                    }));
                    break;

                case 'subscribe':
                    if (this.cTraderSession.getStatus() !== 'connected') {
                        return ws.send(JSON.stringify({ type: 'error', message: 'Cannot subscribe: cTrader session is not connected.', timestamp: Date.now() }));
                    }
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
            await this.cTraderSession.subscribeToSymbols([symbolName]);
        }
    }

    async decrementBackendSubscription(symbolName) {
        const currentCount = this.backendSubscriptions.get(symbolName) || 0;
        if (currentCount > 0) {
            this.backendSubscriptions.set(symbolName, currentCount - 1);
            if (currentCount - 1 === 0) {
                await this.cTraderSession.unsubscribeFromSymbols([symbolName]);
            }
        }
    }
    
    broadcastTick(tick) {
        const message = JSON.stringify({ type: 'tick', ...tick });
        this.wss.clients.forEach((client) => {
            const clientSubs = this.clientSubscriptions.get(client);
            if (client.readyState === WebSocket.OPEN && clientSubs && clientSubs.has(tick.symbol)) {
                client.send(message);
            }
        });
    }

    broadcastStatus(status) {
        console.log(`Broadcasting cTrader connection status: ${status}`);
        const message = {
            type: 'status',
            status: status,
            timestamp: Date.now(),
        };
        // When the session becomes connected, send the available symbols to all clients
        if (status === 'connected') {
            message.availableSymbols = Array.from(this.cTraderSession.symbolMap.keys());
        }
        const serializedMessage = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(serializedMessage);
            }
        });
    }
}

module.exports = { WebSocketServer };