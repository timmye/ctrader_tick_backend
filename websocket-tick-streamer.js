const tls = require('tls');
const protobuf = require('protobufjs');
const path = require('path');
const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('./logger');
require('dotenv').config();

// --- CTraderClient: Custom implementation for cTrader Protocol ---
class CTraderClient extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.socket = null;
        this.receiveBuffer = Buffer.alloc(0);
        this.protoRoot = null;
        this.MessageTypes = {}; // For decoding incoming messages
        this.RequestDecoders = {}; // For encoding outgoing messages
        this.PayloadTypeEnum = {};
    }

    async loadProtos() {
        const protoDir = path.join(__dirname, 'protos');
        const protoFiles = [
            'OpenApiCommonMessages.proto',
            'OpenApiCommonModelMessages.proto',
            'OpenApiMessages.proto',
            'OpenApiModelMessages.proto'
        ].map(f => path.join(protoDir, f));

        this.protoRoot = await protobuf.load(protoFiles);
        this.ProtoMessage = this.protoRoot.lookupType('protobuf.ProtoMessage');
        this.PayloadTypeEnum = this.protoRoot.lookupEnum('protobuf.ProtoOAPayloadType').values;

        // Direct mapping of payload type names to their message types for *decoding incoming* messages
        const MT = (n) => this.protoRoot.lookupType(`protobuf.${n}`);
        this.MessageTypes = {
            PROTO_OA_VERSION_RES: MT('ProtoOAVersionRes'),
            PROTO_OA_APPLICATION_AUTH_RES: MT('ProtoOAApplicationAuthRes'),
            PROTO_OA_ACCOUNT_AUTH_RES: MT('ProtoOAAccountAuthRes'),
            PROTO_OA_SYMBOLS_LIST_RES: MT('ProtoOASymbolsListRes'),
            PROTO_OA_SPOT_EVENT: MT('ProtoOASpotEvent'),
            PROTO_OA_ERROR_RES: MT('ProtoOAErrorRes'),
            PROTO_HEARTBEAT_EVENT: this.protoRoot.lookupType('protobuf.ProtoHeartbeatEvent'),
        };

        // Direct mapping for *encoding outgoing* messages (Req types and Heartbeat)
        this.RequestDecoders = {
            PROTO_OA_VERSION_REQ: MT('ProtoOAVersionReq'),
            PROTO_OA_APPLICATION_AUTH_REQ: MT('ProtoOAApplicationAuthReq'),
            PROTO_OA_ACCOUNT_AUTH_REQ: MT('ProtoOAAccountAuthReq'),
            PROTO_OA_SYMBOLS_LIST_REQ: MT('ProtoOASymbolsListReq'),
            PROTO_OA_SUBSCRIBE_SPOTS_REQ: MT('ProtoOASubscribeSpotsReq'),
            PROTO_OA_UNSUBSCRIBE_SPOTS_REQ: MT('ProtoOAUnsubscribeSpotsReq'),
            PROTO_HEARTBEAT_EVENT: this.protoRoot.lookupType('protobuf.ProtoHeartbeatEvent'),
        };
    }

    connect() {
        return new Promise(async (resolve, reject) => {
            await this.loadProtos();

            this.socket = tls.connect({
                host: this.config.host,
                port: this.config.port,
                servername: this.config.host,
            }, () => {
                logger.info('🔗 CTrader TLS socket connected.');
                this.emit('connect');
                resolve();
            });

            this.socket.on('data', chunk => this.handleData(chunk));
            this.socket.on('error', err => {
                logger.error('⚠️ Socket error:', err.message);
                this.emit('error', err);
                reject(err);
            });
            this.socket.on('close', () => {
                logger.warn('🔌 Socket closed.');
                this.emit('close');
            });
        });
    }

    send(payloadTypeName, payload = {}) {
        // Use RequestDecoders to find the correct message type for the payload
        const RequestMessage = this.RequestDecoders[payloadTypeName];
        if (!RequestMessage) {
            throw new Error(`No message type decoder found for: ${payloadTypeName}`);
        }
        
        const reqPayload = RequestMessage.create(payload);
        const reqBuffer = RequestMessage.encode(reqPayload).finish();
        
        const protoMessage = this.ProtoMessage.create({
            payloadType: this.PayloadTypeEnum[payloadTypeName],
            payload: reqBuffer,
        });

        const wrapBuf = this.ProtoMessage.encode(protoMessage).finish();
        const header = Buffer.alloc(4);
        header.writeUInt32BE(wrapBuf.length, 0);
        
        this.socket.write(header);
        this.socket.write(wrapBuf);
        logger.info(`→ Sent ${payloadTypeName}`);
    }

    handleData(chunk) {
        this.receiveBuffer = Buffer.concat([this.receiveBuffer, chunk]);

        while (this.receiveBuffer.length >= 4) {
            const len = this.receiveBuffer.readUInt32BE(0);
            if (this.receiveBuffer.length < 4 + len) break;

            const msgBuf = this.receiveBuffer.slice(4, 4 + len);
            this.receiveBuffer = this.receiveBuffer.slice(4 + len);
            
            const wrap = this.ProtoMessage.decode(msgBuf);
            const pt = wrap.payloadType;

            const entry = Object.entries(this.PayloadTypeEnum).find(([name, id]) => id === pt);
            if (entry) {
                const [typeName] = entry;
                const MessageType = this.MessageTypes[typeName];
                if (MessageType) {
                    const payload = MessageType.decode(wrap.payload);
                    this.emit(typeName, payload);
                } else {
                    logger.warn(`ℹ️ No decoder for payload type: ${typeName} (${pt})`);
                }
            } else {
                 logger.warn('ℹ️ Unhandled payload', pt);
            }
        }
    }

    close() {
        if (this.socket) {
            this.socket.end();
        }
    }
}


// --- CTraderSession: Application-level logic using CTraderClient ---
class CTraderSession extends EventEmitter {
    constructor() {
        super();
        this.client = new CTraderClient({
            host: process.env.HOST,
            port: parseInt(process.env.PORT, 10),
        });
        
        this.symbolMap = new Map();
        this.reverseSymbolMap = new Map();
        this.subscribedSymbols = new Map();
        this.heartbeatInterval = null;
    }

    async connect() {
        this.client.on('connect', () => {
            // Correctly send the version request with a payload and full typeName
            this.client.send('PROTO_OA_VERSION_REQ', { version: { major: 2, minor: 0, patch: 0 } });
        });

        this.client.on('PROTO_OA_VERSION_RES', () => {
            this.client.send('PROTO_OA_APPLICATION_AUTH_REQ', {
                clientId: process.env.CTRADER_CLIENT_ID,
                clientSecret: process.env.CTRADER_CLIENT_SECRET,
            });
        });

        this.client.on('PROTO_OA_APPLICATION_AUTH_RES', () => {
             this.client.send('PROTO_OA_ACCOUNT_AUTH_REQ', {
                accessToken: process.env.CTRADER_ACCESS_TOKEN,
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
            });
        });
        
        this.client.on('PROTO_OA_ACCOUNT_AUTH_RES', () => {
            logger.info('🔐 Account authenticated');
            this.startHeartbeat();
            this.loadSymbols();
            this.emit('connected');
        });

        this.client.on('PROTO_OA_SYMBOLS_LIST_RES', (payload) => {
             payload.symbol.forEach(s => {
                this.symbolMap.set(s.symbolName, s.symbolId);
                this.reverseSymbolMap.set(s.symbolId, s.symbolName);
            });
            logger.info(`✓ Loaded ${this.symbolMap.size} symbols`);
            this.emit('symbolsLoaded');
        });

        this.client.on('PROTO_OA_SPOT_EVENT', (payload) => {
            const symbolName = this.reverseSymbolMap.get(payload.symbolId);
            if (symbolName) {
                this.emit('tick', {
                    symbol: symbolName,
                    bid: payload.bid / 100000,
                    ask: payload.ask / 100000,
                    timestamp: Date.now(),
                });
            }
        });

        this.client.on('PROTO_OA_ERROR_RES', (payload) => {
            logger.error('API Error:', payload.errorCode, payload.description);
        });
        
        this.client.on('close', () => {
            this.stopHeartbeat();
            this.emit('disconnected');
        });

        await this.client.connect();
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.client.send('PROTO_HEARTBEAT_EVENT');
        }, 25000);
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }

    loadSymbols() {
        this.client.send('PROTO_OA_SYMBOLS_LIST_REQ', {
            ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10)
        });
    }

    subscribe(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId && !this.subscribedSymbols.has(symbolName)) {
            this.client.send('PROTO_OA_SUBSCRIBE_SPOTS_REQ', {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
                symbolId: [symbolId]
            });
            this.subscribedSymbols.set(symbolName, symbolId);
        }
    }

    unsubscribe(symbolName) {
        const symbolId = this.subscribedSymbols.get(symbolName);
        if (symbolId) {
            this.client.send('PROTO_OA_UNSUBSCRIBE_SPOTS_REQ', {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
                symbolId: [symbolId]
            });
            this.subscribedSymbols.delete(symbolName);
        }
    }
    
    close() {
        this.client.close();
    }
}


// --- WebSocketServer and App: No changes needed here ---
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

        const sendAvailableSymbols = () => {
             ws.send(JSON.stringify({
                type: 'connection',
                status: 'connected',
                clientId: clientId,
                availableSymbols: Array.from(this.cTraderSession.symbolMap.keys()),
            }));
        };

        if (this.cTraderSession.symbolMap.size > 0) {
            sendAvailableSymbols();
        } else {
            this.cTraderSession.once('symbolsLoaded', sendAvailableSymbols);
        }

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
        this.reconnectDelay = 5000;

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
    app.cTraderSession.close();
    process.exit(0);
});
