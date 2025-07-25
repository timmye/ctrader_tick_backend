const WebSocket = require('ws');

class WebSocketServer {
    constructor(port, cTraderSession) {
        this.wss = new WebSocket.Server({ port });
        this.cTraderSession = cTraderSession;
        this.clientSubscriptions = new Map(); // Map: WebSocket -> Set<symbolName>
        this.backendSubscriptions = new Map(); // Map: symbolName -> count of clients

        this.currentBackendStatus = 'disconnected';
        this.currentAvailableSymbols = [];

        this.wss.on('connection', (ws) => this.handleConnection(ws));
        
        this.wss.on('listening', () => {
             this.updateBackendStatus('ws-open');
             console.log(`WebSocket server listening on port ${port}`);
         });

         this.wss.on('error', (error) => {
             console.error('WebSocket Server error:', error);
             this.updateBackendStatus('error', error.message);
         });

        // Listen for the new symbolDataPackage event
        this.cTraderSession.on('symbolDataPackage', (dataPackage) => this.broadcastDataPackage(dataPackage));
        this.cTraderSession.on('tick', (tick) => this.broadcastTick(tick));
        
        this.cTraderSession.on('connected', (availableSymbols) => { 
             this.currentAvailableSymbols = availableSymbols;
             this.updateBackendStatus('connected', null, this.currentAvailableSymbols);
         });

        this.cTraderSession.on('disconnected', () => { 
             this.currentAvailableSymbols = [];
             this.updateBackendStatus('disconnected');
         });

        this.cTraderSession.on('error', (error) => { 
             this.currentAvailableSymbols = [];
             this.updateBackendStatus('error', error.message);
         });

        this.updateBackendStatus('ws-connecting');
    }

    updateBackendStatus(status, message = null, availableSymbols = []) {
        this.currentBackendStatus = status;
        this.currentAvailableSymbols = availableSymbols;
        const statusData = { type: 'status', status: this.currentBackendStatus, availableSymbols: this.currentAvailableSymbols };
        if (message) statusData.message = message;
        this.broadcastToAll(statusData);
    }
    
    broadcastDataPackage(dataPackage) {
        console.log(`Broadcasting data package for ${dataPackage.symbol}`);
        this.broadcastToSubscribers(dataPackage.symbol, { type: 'symbolDataPackage', ...dataPackage });
    }

    handleConnection(ws) {
        console.log('Client connected');
        this.clientSubscriptions.set(ws, new Set());
        ws.on('message', (message) => this.handleMessage(ws, message));
        ws.on('close', () => this.handleClose(ws));
        ws.on('error', (error) => this.handleError(ws, error));
    }

    handleMessage(ws, message) {
        const data = JSON.parse(message);
        console.log(`Received message from client: ${data.type}`);

        switch (data.type) {
            case 'connect':
                 this.sendToClient(ws, { 
                     type: 'status', 
                     status: this.currentBackendStatus,
                     availableSymbols: this.currentAvailableSymbols 
                 });
                break;
            case 'subscribe':
                if (data.symbols && Array.isArray(data.symbols)) {
                    this.subscribeClientToSymbols(ws, data.symbols);
                }
                break;
            case 'unsubscribe':
                if (data.symbols && Array.isArray(data.symbols)) {
                    this.unsubscribeClientFromSymbols(ws, data.symbols);
                }
                break;
            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    }
    
    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcastToAll(data) {
        this.wss.clients.forEach(client => {
            this.sendToClient(client, data);
        });
    }

    broadcastToSubscribers(symbol, data) {
        const subscribers = this.backendSubscriptions.get(symbol);
        if (subscribers && subscribers > 0) {
             this.wss.clients.forEach(client => {
                const clientSubs = this.clientSubscriptions.get(client);
                if (clientSubs && clientSubs.has(symbol)) {
                    this.sendToClient(client, data);
                }
            });
        }
    }

    broadcastTick(tick) {
        this.broadcastToSubscribers(tick.symbol, { type: 'tick', ...tick });
    }

    subscribeClientToSymbols(ws, symbols) {
        const clientSubs = this.clientSubscriptions.get(ws);
        if (!clientSubs) return;

        symbols.forEach(symbol => {
            if (this.currentBackendStatus === 'connected' && this.currentAvailableSymbols.includes(symbol)) {
                 if (!clientSubs.has(symbol)) {
                    clientSubs.add(symbol);
                    this.backendSubscriptions.set(symbol, (this.backendSubscriptions.get(symbol) || 0) + 1);

                    if (this.backendSubscriptions.get(symbol) === 1) {
                        this.cTraderSession.subscribeTicks(symbol);
                    }
                 }
            }
        });
    }

    unsubscribeClientFromSymbols(ws, symbols) {
         const clientSubs = this.clientSubscriptions.get(ws);
         if (!clientSubs) return;

        symbols.forEach(symbol => {
            if (clientSubs.has(symbol)) {
                clientSubs.delete(symbol);
                const currentSubscribers = (this.backendSubscriptions.get(symbol) || 1) - 1;
                this.backendSubscriptions.set(symbol, currentSubscribers);

                if (currentSubscribers <= 0) {
                    this.cTraderSession.unsubscribeTicks(symbol);
                    this.backendSubscriptions.delete(symbol);
                }
            }
        });
    }

    handleClose(ws) {
        console.log('Client disconnected');
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
