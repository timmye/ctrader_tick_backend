const WebSocket = require('ws');

class WebSocketServer {
    constructor(port, cTraderSession) {
        this.wss = new WebSocket.Server({ port });
        this.cTraderSession = cTraderSession;
        this.clientSubscriptions = new Map();
        this.backendSubscriptions = new Map();

        this.currentBackendStatus = 'disconnected';
        this.currentAvailableSymbols = [];

        this.wss.on('connection', (ws) => this.handleConnection(ws));
        this.wss.on('listening', () => this.updateBackendStatus('ws-open'));
        this.wss.on('error', (error) => this.updateBackendStatus('error', error.message));

        this.cTraderSession.on('tick', (tick) => this.broadcastTick(tick));
        this.cTraderSession.on('connected', (symbols) => this.updateBackendStatus('connected', null, symbols));
        this.cTraderSession.on('disconnected', () => this.updateBackendStatus('disconnected'));
        this.cTraderSession.on('error', (error) => this.updateBackendStatus('error', error.message));

        this.updateBackendStatus('ws-connecting');
    }

    updateBackendStatus(status, message = null, availableSymbols = []) {
        this.currentBackendStatus = status;
        this.currentAvailableSymbols = availableSymbols;
        const statusData = { type: 'status', status, availableSymbols };
        if (message) statusData.message = message;
        this.broadcastToAll(statusData);
    }

    handleConnection(ws) {
        console.log('Client connected');
        this.clientSubscriptions.set(ws, new Set());
        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('close', () => this.handleClose(ws));
        ws.on('error', (error) => this.handleError(ws, error));
    }

    async handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            console.log(`Received message: ${data.type}`);

            switch (data.type) {
                case 'connect':
                    this.sendToClient(ws, { 
                        type: 'status', 
                        status: this.currentBackendStatus,
                        availableSymbols: this.currentAvailableSymbols 
                    });
                    break;
                case 'get_symbol_data':
                    await this.handleGetSymbolData(ws, data.symbol);
                    break;
                case 'start_tick_stream':
                    await this.handleStartTickStream(ws, data.symbol);
                    break;
                case 'unsubscribe':
                    if (data.symbols) this.unsubscribeClientFromSymbols(ws, data.symbols);
                    break;
                default:
                    console.warn(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Failed to handle message:', error);
            this.sendToClient(ws, { type: 'error', message: 'Invalid message format.' });
        }
    }

    async handleGetSymbolData(ws, symbolName) {
        if (!symbolName || !this.currentAvailableSymbols.includes(symbolName)) {
            return this.sendToClient(ws, { type: 'error', message: `Invalid symbol: ${symbolName}` });
        }
        try {
            console.log(`Fetching initial data for ${symbolName}...`);
            const dataPackage = await this.cTraderSession.getSymbolDataPackage(symbolName);
            this.sendToClient(ws, { type: 'symbolDataPackage', ...dataPackage });
        } catch (error) {
            console.error(`Failed to get data package for ${symbolName}:`, error);
            this.sendToClient(ws, { type: 'error', message: `Failed to get data for ${symbolName}.` });
        }
    }

    async handleStartTickStream(ws, symbolName) {
        if (!symbolName || !this.currentAvailableSymbols.includes(symbolName)) return;

        const clientSubs = this.clientSubscriptions.get(ws);
        if (clientSubs && !clientSubs.has(symbolName)) {
            clientSubs.add(symbolName);
            const subCount = (this.backendSubscriptions.get(symbolName) || 0) + 1;
            this.backendSubscriptions.set(symbolName, subCount);

            if (subCount === 1) {
                console.log(`First subscriber. Starting tick stream for ${symbolName}.`);
                await this.cTraderSession.subscribeToTicks(symbolName);
            }
        }
    }
    
    unsubscribeClientFromSymbols(ws, symbols) {
        const clientSubs = this.clientSubscriptions.get(ws);
        if (!clientSubs) return;

        for (const symbolName of symbols) {
            if (clientSubs.has(symbolName)) {
                clientSubs.delete(symbolName);
                const subCount = (this.backendSubscriptions.get(symbolName) || 1) - 1;
                this.backendSubscriptions.set(symbolName, subCount);

                if (subCount === 0) {
                    console.log(`Last subscriber. Stopping tick stream for ${symbolName}.`);
                    this.cTraderSession.unsubscribeFromTicks(symbolName);
                    this.backendSubscriptions.delete(symbolName);
                }
            }
        }
    }

    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcastToAll(data) {
        this.wss.clients.forEach(client => this.sendToClient(client, data));
    }

    broadcastToSubscribers(symbol, data) {
        this.wss.clients.forEach(client => {
            const clientSubs = this.clientSubscriptions.get(client);
            if (clientSubs && clientSubs.has(symbol)) {
                this.sendToClient(client, data);
            }
        });
    }
    
    broadcastTick(tick) {
        this.broadcastToSubscribers(tick.symbol, { type: 'tick', ...tick });
    }

    handleClose(ws) {
        console.log('Client disconnected');
        this.unsubscribeClientFromSymbols(ws, Array.from(this.clientSubscriptions.get(ws) || []));
        this.clientSubscriptions.delete(ws);
    }

    handleError(ws, error) {
        console.error('Client WebSocket error:', error);
        if (ws.readyState !== WebSocket.CLOSING && ws.readyState !== WebSocket.CLOSED) {
            ws.close();
        }
    }
}

module.exports = { WebSocketServer };
