const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketBridge extends EventEmitter {
    constructor(port = 3001) {
        super();
        this.port = port;
        this.server = null;
        this.clients = new Set();
        this.symbolCache = new Map();
        this.tickBuffer = new Map();
        this.batchInterval = parseInt(process.env.TICK_BATCH_INTERVAL) || 100;
        this.maxTicksPerSymbol = parseInt(process.env.MAX_TICKS_PER_SYMBOL) || 100;
        
        this.startBatching();
    }

    createBridge() {
        this.server = new WebSocket.Server({ port: this.port });
        
        this.server.on('connection', (ws) => {
            console.log('WebSocket client connected');
            this.clients.add(ws);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleClientSubscription(ws, message);
                } catch (error) {
                    console.error('Invalid message format:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
        
        console.log(`WebSocket server listening on port ${this.port}`);
    }

    handleClientSubscription(ws, message) {
        if (message.type === 'subscribe' && message.symbols) {
            ws.subscribedSymbols = message.symbols.slice(0, 24); // Max 24 symbols
            console.log(`Client subscribed to: ${ws.subscribedSymbols.join(', ')}`);
            
            // Send initial data
            const initialData = {};
            ws.subscribedSymbols.forEach(symbol => {
                if (this.symbolCache.has(symbol)) {
                    initialData[symbol] = this.symbolCache.get(symbol);
                }
            });
            
            ws.send(JSON.stringify({
                type: 'initial',
                data: initialData
            }));
        }
    }

    broadcastTick(symbol, tickData) {
        if (!this.tickBuffer.has(symbol)) {
            this.tickBuffer.set(symbol, []);
        }
        
        const buffer = this.tickBuffer.get(symbol);
        buffer.push({
            symbol,
            price: tickData.price,
            timestamp: Date.now()
        });
        
        // Keep only latest 100 ticks per symbol
        if (buffer.length > this.maxTicksPerSymbol) {
            buffer.shift();
        }
        
        // Update cache
        this.symbolCache.set(symbol, tickData);
    }

    startBatching() {
        setInterval(() => {
            if (this.tickBuffer.size === 0) return;
            
            const batch = {};
            this.tickBuffer.forEach((ticks, symbol) => {
                if (ticks.length > 0) {
                    batch[symbol] = ticks[ticks.length - 1]; // Latest tick
                }
            });
            
            this.tickBuffer.clear();
            
            // Send to all connected clients
            this.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    const relevantData = {};
                    Object.keys(batch).forEach(symbol => {
                        if (!client.subscribedSymbols || client.subscribedSymbols.includes(symbol)) {
                            relevantData[symbol] = batch[symbol];
                        }
                    });
                    
                    if (Object.keys(relevantData).length > 0) {
                        client.send(JSON.stringify({
                            type: 'tick',
                            data: relevantData
                        }));
                    }
                }
            });
        }, this.batchInterval);
    }

    getConnectedClients() {
        return this.clients.size;
    }

    getSubscribedSymbols() {
        const symbols = new Set();
        this.clients.forEach(client => {
            if (client.subscribedSymbols) {
                client.subscribedSymbols.forEach(symbol => symbols.add(symbol));
            }
        });
        return Array.from(symbols);
    }
}

module.exports = WebSocketBridge;