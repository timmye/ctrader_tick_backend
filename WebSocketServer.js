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
        
        this.cTraderSession.on('tick', (tick) => this.broadcastTick(tick));
        this.cTraderSession.on('connected', (symbols) => this.updateBackendStatus('connected', null, symbols));
        this.cTraderSession.on('disconnected', () => this.updateBackendStatus('disconnected'));
        this.cTraderSession.on('error', (error) => this.updateBackendStatus('error', error.message));
    }

    updateBackendStatus(status, message = null, availableSymbols = []) {
        this.currentBackendStatus = status;
        if (availableSymbols && availableSymbols.length > 0) {
            this.currentAvailableSymbols = availableSymbols;
        }
        
        const statusData = { type: 'status', status, availableSymbols: this.currentAvailableSymbols };
        if (message) statusData.message = message;
        this.broadcastToAll(statusData);

        if (status === 'connected') {
            this.broadcastToAll({ type: 'ready', availableSymbols: this.currentAvailableSymbols });
        }
    }

    handleConnection(ws) {
        console.log('Client connected');
        this.clientSubscriptions.set(ws, new Set());
        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('close', () => this.handleClose(ws));
        ws.on('error', (error) => console.error('Client WebSocket error:', error));

        if (this.currentBackendStatus === 'connected') {
            this.sendToClient(ws, { type: 'ready', availableSymbols: this.currentAvailableSymbols });
        }
    }

    async handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            if (data.symbol) {
                console.log(`[SYMBOL_TRACE | WebSocketServer] Received initial request from client for symbol: ${data.symbol}`);
            }

            switch (data.type) {
                case 'get_symbol_data_package':
                    await this.handleSubscribe(ws, data.symbol, data.adrLookbackDays);
                    break;
                case 'unsubscribe':
                    if (data.symbols) this.handleUnsubscribe(ws, data.symbols);
                    break;
                default:
                    console.warn(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            console.error('Failed to handle message:', error);
            this.sendToClient(ws, { type: 'error', message: 'Invalid message format.' });
        }
    }

    async handleSubscribe(ws, symbolName, adrLookbackDays = 14) {
        if (!symbolName || !this.currentAvailableSymbols.includes(symbolName)) {
            return this.sendToClient(ws, { type: 'error', message: `Invalid symbol: ${symbolName}` });
        }
        try {
            const dataPackage = await this.cTraderSession.getSymbolDataPackage(symbolName, adrLookbackDays);
            
            console.log(`[E2E_TRACE | WebSocketServer] Sending package with ${dataPackage.initialMarketProfile.length} profile entries.`);
            
            this.sendToClient(ws, { type: 'symbolDataPackage', ...dataPackage });

            const clientSubs = this.clientSubscriptions.get(ws);
            if (clientSubs && !clientSubs.has(symbolName)) {
                clientSubs.add(symbolName);
                
                let symbolSubscribers = this.backendSubscriptions.get(symbolName);
                if (!symbolSubscribers) {
                    symbolSubscribers = new Set();
                    this.backendSubscriptions.set(symbolName, symbolSubscribers);
                }

                if (symbolSubscribers.size === 0) {
                    await this.cTraderSession.subscribeToTicks(symbolName);
                }
                symbolSubscribers.add(ws);
            }

        } catch (error) {
            console.error(`Failed to get data package for ${symbolName}:`, error);
            this.sendToClient(ws, { type: 'error', message: `Failed to get data for ${symbolName}: ${error.message}` });
        }
    }
    
    handleUnsubscribe(ws, symbols) {
        const clientSubs = this.clientSubscriptions.get(ws);
        if (!clientSubs) return;

        for (const symbolName of symbols) {
            if (clientSubs.has(symbolName)) {
                clientSubs.delete(symbolName);
                
                const symbolSubscribers = this.backendSubscriptions.get(symbolName);
                if (symbolSubscribers) {
                    symbolSubscribers.delete(ws);
                    if (symbolSubscribers.size === 0) {
                        this.cTraderSession.unsubscribeFromTicks(symbolName);
                        this.backendSubscriptions.delete(symbolName);
                    }
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
    
    broadcastTick(tick) {
        const symbolSubscribers = this.backendSubscriptions.get(tick.symbol);
        if (symbolSubscribers) {
            const message = JSON.stringify({ type: 'tick', ...tick });
            symbolSubscribers.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }

    handleClose(ws) {
        console.log('Client disconnected');
        this.handleUnsubscribe(ws, Array.from(this.clientSubscriptions.get(ws) || []));
        this.clientSubscriptions.delete(ws);
    }
}

module.exports = { WebSocketServer };
