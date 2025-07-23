const WebSocket = require('ws');
const { CTraderConnection, ProtoOAPayloadType } = require('@reiryoku/ctrader-layer');
const EventEmitter = require('events');
const logger = require('./logger');
const SymbolSubscription = require('./src/subscription/SymbolSubscription');
require('dotenv').config();

class CTraderSession extends EventEmitter {
    constructor() {
        super();
        this.connection = null;
        this.isConnected = false;
        this.isAuthenticated = false;
        this.symbolMap = new Map();
        this.reverseSymbolMap = new Map();
        this.subscription = null;
    }

    async connect() {
        this.connection = new CTraderConnection({
            host: process.env.HOST || 'demo.ctraderapi.com',
            port: parseInt(process.env.PORT, 10) || 5035,
        });

        this.connection.on('close', () => this.handleDisconnect());
        this.connection.on('error', (error) => this.emit('error', error));
        // Use string name for event listener as per hypothesis
        this.connection.on('PROTO_OA_SPOT_EVENT', (message) => {
            // The message received here is already parsed by the library
            if (this.subscription) {
                this.subscription.handleTick(message);
            }
        });

        try {
            await this.connection.open();
            this.isConnected = true;
            logger.info('✓ cTrader connection established');
            await this.authenticate();
            await this.loadSymbols();
            
            // Pass the connection to SymbolSubscription so it can use sendCommand
            this.subscription = new SymbolSubscription(this.connection);
            this.subscription.on('tick', (tick) => this.emit('tick', tick));
            this.subscription.on('error', (error) => logger.error('Subscription error:', error));

            this.emit('connected');
        } catch (error) {
            logger.error('✗ cTrader connection failed:', error);
            this.handleDisconnect();
        }
    }

    async authenticate() {
        try {
            // Use string names for sendCommand
            await this.connection.sendCommand('ProtoOAApplicationAuthReq', {
                clientId: process.env.CTRADER_CLIENT_ID,
                clientSecret: process.env.CTRADER_CLIENT_SECRET,
            });
            await this.connection.sendCommand('ProtoOAAccountAuthReq', {
                accessToken: process.env.CTRADER_ACCESS_TOKEN,
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
            });
            this.isAuthenticated = true;
            logger.info('✓ cTrader authentication successful');
        } catch (error) {
            logger.error('✗ cTrader authentication failed:', error);
            throw error;
        }
    }

    async loadSymbols() {
        try {
            // Use string name for sendCommand
            const data = await this.connection.sendCommand('ProtoOASymbolsListReq', {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
            });
            data.symbol.forEach(s => {
                this.symbolMap.set(s.symbolName, s.symbolId);
                this.reverseSymbolMap.set(s.symbolId, s.symbolName);
            });
            logger.info(`✓ Loaded ${this.symbolMap.size} symbols`);
        } catch (error) {
            logger.error('✗ Failed to load symbols:', error);
            throw error;
        }
    }

    subscribe(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId && this.subscription) {
            this.subscription.subscribe(symbolName, symbolId);
        }
    }

    unsubscribe(symbolName) {
        if (this.subscription) {
            this.subscription.unsubscribe(symbolName);
        }
    }

    handleDisconnect() {
        this.isConnected = false;
        this.isAuthenticated = false;
        if (this.subscription) {
            this.subscription.removeAllListeners();
            this.subscription = null;
        }
        logger.warn('cTrader connection lost. Attempting to reconnect...');
        this.emit('disconnected');
    }

    async close() {
        if (this.connection) {
            await this.connection.close();
        }
    }
}

class WebSocketServer extends EventEmitter {
    constructor(port, cTraderSession) {
        super();
        this.wss = new WebSocket.Server({ port });
        this.cTraderSession = cTraderSession;
        this.clients = new Map();

        this.wss.on('connection', ws => this.handleConnection(ws));
        this.cTraderSession.on('tick', tick => this.broadcastTick(tick));
    }

    handleConnection(ws) {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const client = { id: clientId, subscriptions: new Set() };
        this.clients.set(ws, client);
        logger.info(`📱 Client connected: ${clientId}`);

        ws.send(JSON.stringify({
            type: 'connection',
            status: 'connected',
            clientId: clientId,
            availableSymbols: Array.from(this.cTraderSession.symbolMap.keys()),
        }));

        ws.on('message', message => this.handleMessage(ws, message, client));
        ws.on('close', () => this.handleDisconnect(ws, client));
        ws.on('error', (error) => logger.error(`WebSocket error for client ${client.id}:`, error));
    }

    handleMessage(ws, message, client) {
        try {
            const parsedMessage = JSON.parse(message);
            switch (parsedMessage.type) {
                case 'subscribe':
                    this.handleSubscription(client, parsedMessage.symbols, 'subscribe');
                    break;
                case 'unsubscribe':
                    this.handleSubscription(client, parsedMessage.symbols, 'unsubscribe');
                    break;
            }
        } catch (error) {
            logger.error('Error handling client message:', error);
        }
    }

    handleSubscription(client, symbols, type) {
        symbols.forEach(symbolName => {
            if (type === 'subscribe') {
                client.subscriptions.add(symbolName);
                this.cTraderSession.subscribe(symbolName);
            } else {
                client.subscriptions.delete(symbolName);
                if (!this.isSymbolNeeded(symbolName)) {
                    this.cTraderSession.unsubscribe(symbolName);
                }
            }
        });
    }

    handleDisconnect(ws, client) {
        logger.info(`📱 Client disconnected: ${client.id}`);
        client.subscriptions.forEach(symbolName => {
            if (!this.isSymbolNeeded(symbolName, ws)) {
                this.cTraderSession.unsubscribe(symbolName);
            }
        });
        this.clients.delete(ws);
    }

    isSymbolNeeded(symbolName, excludedClient = null) {
        for (const [ws, client] of this.clients.entries()) {
            if (excludedClient && ws === excludedClient) continue;
            if (client.subscriptions.has(symbolName)) {
                return true;
            }
        }
        return false;
    }

    broadcastTick(tick) {
        const message = JSON.stringify(tick);
        this.clients.forEach((client, ws) => {
            if (ws.readyState === WebSocket.OPEN && client.subscriptions.has(tick.symbol)) {
                ws.send(message);
            }
        });
    }
}

class App {
    constructor() {
        this.cTraderSession = new CTraderSession();
        this.webSocketServer = new WebSocketServer(process.env.PORT || 8080, this.cTraderSession);
        this.reconnectTimeout = null;
        this.reconnectDelay = 1000;

        this.cTraderSession.on('disconnected', () => this.scheduleReconnect());
    }

    async start() {
        this.validateEnvironment();
        await this.cTraderSession.connect();
    }

    scheduleReconnect() {
        if (this.reconnectTimeout) return;
        this.reconnectTimeout = setTimeout(async () => {
            logger.info(`Attempting to reconnect in ${this.reconnectDelay / 1000}s`);
            this.reconnectTimeout = null;
            await this.cTraderSession.connect();
            if (!this.cTraderSession.isConnected) {
                this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
            } else {
                this.reconnectDelay = 1000;
            }
        }, this.reconnectDelay);
    }

    validateEnvironment() {
        const required = ['CTRADER_CLIENT_ID', 'CTRADER_CLIENT_SECRET', 'CTRADER_ACCESS_TOKEN', 'CTRADER_ACCOUNT_ID'];
        if (required.some(key => !process.env[key])) {
            logger.error('Missing required environment variables. Please check your .env file');
            process.exit(1);
        }
    }
}

const app = new App();
app.start();

process.on('SIGINT', async () => {
    await app.cTraderSession.close();
    process.exit(0);
});
