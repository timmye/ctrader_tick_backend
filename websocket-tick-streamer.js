const WebSocket = require('ws');
const { CTraderConnection } = require('@reiryoku/ctrader-layer');
const EventEmitter = require('events');
require('dotenv').config();

class WebSocketTickStreamer extends EventEmitter {
    constructor(port = process.env.PORT || 8080) {
        super();
        this.wsPort = port;
        this.wss = null;
        this.connection = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.subscribedSymbols = new Set();
        this.clients = new Map(); // Track client subscriptions
        this.symbolIdMap = this.createSymbolIdMap();
        this.reverseSymbolMap = this.createReverseSymbolMap();
    }

    createSymbolIdMap() {
        return {
            'EURUSD': 1, 'GBPUSD': 2, 'USDJPY': 3, 'USDCHF': 4,
            'AUDUSD': 5, 'USDCAD': 6, 'NZDUSD': 7, 'EURGBP': 8,
            'EURJPY': 9, 'GBPJPY': 10, 'AUDCAD': 11, 'AUDCHF': 12,
            'AUDJPY': 13, 'AUDNZD': 14, 'CADCHF': 15, 'CADJPY': 16,
            'CHFJPY': 17, 'EURAUD': 18, 'EURCAD': 19, 'EURCHF': 20,
            'EURNZD': 21, 'GBPAUD': 22, 'GBPCAD': 23, 'GBPCHF': 24,
            'GBPNZD': 25, 'NZDCAD': 26, 'NZDCHF': 27, 'NZDJPY': 28
        };
    }

    createReverseSymbolMap() {
        const reverse = {};
        Object.entries(this.symbolIdMap).forEach(([symbol, id]) => {
            reverse[id] = symbol;
        });
        return reverse;
    }

    async initializeCTrader() {
        try {
            console.log('Connecting to cTrader API...');
            this.connection = new CTraderConnection({
                host: process.env.HOST || 'demo.ctraderapi.com',
                port: parseInt(process.env.PORT) || 5035
            });

            await this.connection.open();
            this.isConnected = true;
            console.log('✓ cTrader connection established');

            await this.authenticate();
            this.setupTickHandler();
            
        } catch (error) {
            console.error('✗ cTrader initialization failed:', error.message);
            throw error;
        }
    }

    async authenticate() {
        try {
            console.log('Authenticating with cTrader...');
            
            // Application authentication
            await this.connection.sendCommand(2100, {
                clientId: process.env.CTRADER_CLIENT_ID,
                clientSecret: process.env.CTRADER_CLIENT_SECRET
            });

            // Account authentication
            await this.connection.sendCommand(2102, {
                accessToken: process.env.CTRADER_ACCESS_TOKEN,
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID)
            });

            this.isAuthenticated = true;
            console.log('✓ cTrader authentication successful');
        } catch (error) {
            console.error('✗ cTrader authentication failed:', error.message);
            throw error;
        }
    }

    setupTickHandler() {
        this.connection.on(2131, (tickData) => {
            this.handleTick(tickData);
        });
    }

    handleTick(tick) {
        const symbol = this.reverseSymbolMap[tick.symbolId];
        if (!symbol) return;

        const tickUpdate = {
            type: 'tick',
            symbol: symbol,
            symbolId: tick.symbolId,
            bid: (tick.bid / 100000).toFixed(5),
            ask: (tick.ask / 100000).toFixed(5),
            timestamp: Date.now(),
            spread: ((tick.ask - tick.bid) / 100000).toFixed(5)
        };

        // Broadcast to all subscribed clients
        this.broadcastToSubscribedClients(symbol, tickUpdate);
        
        // Emit for internal use
        this.emit('tick', tickUpdate);
    }

    broadcastToSubscribedClients(symbol, data) {
        this.clients.forEach((clientData, ws) => {
            if (ws.readyState === WebSocket.OPEN && clientData.subscriptions.has(symbol)) {
                ws.send(JSON.stringify(data));
            }
        });
    }

    async subscribeToSymbol(symbol) {
        const symbolId = this.symbolIdMap[symbol.toUpperCase()];
        if (!symbolId) {
            throw new Error(`Unknown symbol: ${symbol}`);
        }

        if (this.subscribedSymbols.has(symbolId)) {
            return; // Already subscribed
        }

        try {
            await this.connection.sendCommand(2127, {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID),
                symbolId: [symbolId]
            });
            
            this.subscribedSymbols.add(symbolId);
            console.log(`✓ Subscribed to ${symbol} (ID: ${symbolId})`);
        } catch (error) {
            console.error(`✗ Failed to subscribe to ${symbol}:`, error.message);
            throw error;
        }
    }

    async unsubscribeFromSymbol(symbol) {
        const symbolId = this.symbolIdMap[symbol.toUpperCase()];
        if (!symbolId || !this.subscribedSymbols.has(symbolId)) {
            return; // Not subscribed
        }

        // Check if any other clients are still subscribed to this symbol
        let stillNeeded = false;
        this.clients.forEach((clientData) => {
            if (clientData.subscriptions.has(symbol.toUpperCase())) {
                stillNeeded = true;
            }
        });

        if (!stillNeeded) {
            try {
                await this.connection.sendCommand(2128, {
                    ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID),
                    symbolId: [symbolId]
                });
                
                this.subscribedSymbols.delete(symbolId);
                console.log(`✓ Unsubscribed from ${symbol} (ID: ${symbolId})`);
            } catch (error) {
                console.error(`✗ Failed to unsubscribe from ${symbol}:`, error.message);
            }
        }
    }

    startWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.wsPort,
            host: '0.0.0.0' // IDX requires binding to all interfaces
        });
        console.log(`🚀 WebSocket server started on port ${this.wsPort} (all interfaces)`);

        this.wss.on('connection', (ws, request) => {
            const clientId = this.generateClientId();
            console.log(`📱 Client connected: ${clientId}`);
            
            // Initialize client data
            this.clients.set(ws, {
                id: clientId,
                subscriptions: new Set(),
                connectedAt: Date.now()
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection',
                status: 'connected',
                clientId: clientId,
                availableSymbols: Object.keys(this.symbolIdMap),
                timestamp: Date.now()
            }));

            ws.on('message', async (message) => {
                try {
                    await this.handleClientMessage(ws, JSON.parse(message.toString()));
                } catch (error) {
                    console.error('Error handling client message:', error.message);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message,
                        timestamp: Date.now()
                    }));
                }
            });

            ws.on('close', () => {
                this.handleClientDisconnect(ws);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error for client ${clientId}:`, error.message);
                this.handleClientDisconnect(ws);
            });
        });
    }

    async handleClientMessage(ws, message) {
        const clientData = this.clients.get(ws);
        if (!clientData) return;

        switch (message.type) {
            case 'subscribe':
                await this.handleSubscribe(ws, message.symbols);
                break;
            case 'unsubscribe':
                await this.handleUnsubscribe(ws, message.symbols);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'getSubscriptions':
                ws.send(JSON.stringify({
                    type: 'subscriptions',
                    symbols: Array.from(clientData.subscriptions),
                    timestamp: Date.now()
                }));
                break;
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${message.type}`,
                    timestamp: Date.now()
                }));
        }
    }

    async handleSubscribe(ws, symbols) {
        const clientData = this.clients.get(ws);
        const results = [];

        for (const symbol of symbols) {
            try {
                const upperSymbol = symbol.toUpperCase();
                
                // Subscribe to symbol if not already subscribed
                await this.subscribeToSymbol(upperSymbol);
                
                // Add to client subscriptions
                clientData.subscriptions.add(upperSymbol);
                
                results.push({ symbol: upperSymbol, status: 'subscribed' });
            } catch (error) {
                results.push({ symbol: symbol, status: 'error', message: error.message });
            }
        }

        ws.send(JSON.stringify({
            type: 'subscribeResponse',
            results: results,
            timestamp: Date.now()
        }));
    }

    async handleUnsubscribe(ws, symbols) {
        const clientData = this.clients.get(ws);
        const results = [];

        for (const symbol of symbols) {
            const upperSymbol = symbol.toUpperCase();
            
            // Remove from client subscriptions
            clientData.subscriptions.delete(upperSymbol);
            
            // Unsubscribe from cTrader if no other clients need it
            await this.unsubscribeFromSymbol(upperSymbol);
            
            results.push({ symbol: upperSymbol, status: 'unsubscribed' });
        }

        ws.send(JSON.stringify({
            type: 'unsubscribeResponse',
            results: results,
            timestamp: Date.now()
        }));
    }

    handleClientDisconnect(ws) {
        const clientData = this.clients.get(ws);
        if (clientData) {
            console.log(`📱 Client disconnected: ${clientData.id}`);
            
            // Clean up subscriptions for this client
            clientData.subscriptions.forEach(async (symbol) => {
                await this.unsubscribeFromSymbol(symbol);
            });
            
            this.clients.delete(ws);
        }
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getStatus() {
        return {
            ctraderConnected: this.isConnected,
            ctraderAuthenticated: this.isAuthenticated,
            connectedClients: this.clients.size,
            subscribedSymbols: Array.from(this.subscribedSymbols).map(id => this.reverseSymbolMap[id]),
            timestamp: Date.now()
        };
    }

    async start() {
        try {
            // Validate environment
            this.validateEnvironment();
            
            // Initialize cTrader connection
            await this.initializeCTrader();
            
            // Start WebSocket server
            this.startWebSocketServer();
            
            console.log('🎯 WebSocket Tick Streamer is ready for frontend connections!');
            console.log(`📡 Connect to: ws://localhost:${this.wsPort}`);
            console.log(`📡 IDX Preview URL: Check your IDX preview for WebSocket endpoint`);
            
        } catch (error) {
            console.error('Failed to start WebSocket Tick Streamer:', error.message);
            process.exit(1);
        }
    }

    async stop() {
        console.log('🛑 Stopping WebSocket Tick Streamer...');
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close cTrader connection
        if (this.connection && this.isConnected) {
            try {
                await this.connection.close();
                console.log('✓ cTrader connection closed');
            } catch (error) {
                console.error('Error closing cTrader connection:', error.message);
            }
        }
        
        process.exit(0);
    }

    validateEnvironment() {
        const required = ['CTRADER_CLIENT_ID', 'CTRADER_CLIENT_SECRET', 'CTRADER_ACCESS_TOKEN', 'CTRADER_ACCOUNT_ID'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.error('Missing required environment variables:', missing.join(', '));
            console.error('Please check your .env file');
            process.exit(1);
        }
    }
}

// Usage example
if (require.main === module) {
    const streamer = new WebSocketTickStreamer(process.env.PORT || 8080);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => streamer.stop());
    process.on('SIGTERM', () => streamer.stop());
    
    // Start the WebSocket streamer
    streamer.start();
}

module.exports = WebSocketTickStreamer;