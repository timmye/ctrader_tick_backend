const EventEmitter = require('events');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { CTraderConnection } = require('./cTrader-Layer/build/entry/node/main');

class CTraderSession extends EventEmitter {
    constructor() {
        super();
        this.connection = null;
        this.heartbeatInterval = null;
        this.ctidTraderAccountId = parseInt(process.env.CTRADER_ACCOUNT_ID, 10);
        this.accessToken = process.env.CTRADER_ACCESS_TOKEN;
        this.clientId = process.env.CTRADER_CLIENT_ID;
        this.clientSecret = process.env.CTRADER_CLIENT_SECRET;
        
        // Maps for symbol data
        this.symbolMap = new Map(); // Name -> ID
        this.reverseSymbolMap = new Map(); // ID -> Name
    }

    async connect() {
        this.connection = new CTraderConnection({
            host: process.env.HOST,
            port: parseInt(process.env.PORT, 10),
        });

        this.connection.on('PROTO_OA_SPOT_EVENT', (event) => {
            // console.log('Received raw PROTO_OA_SPOT_EVENT:', event); // Removed log
            
            // Convert Long symbolId to a number for map lookup
            const symbolId = event.symbolId.toNumber();
            const symbolName = this.reverseSymbolMap.get(symbolId);

            if (symbolName) {
                const tick = {
                    symbol: symbolName,
                    symbolId: symbolId,
                    bid: event.bid / 100000.0,
                    ask: event.ask / 100000.0,
                    spread: (event.ask - event.bid) / 100000.0,
                    timestamp: Date.now(),
                };
                // console.log('Processed tick object:', tick); // Removed log
                this.emit('tick', tick);
                // console.log('CTraderSession emitted tick event'); // Removed log
            } else {
                console.warn(`Received tick for unknown symbolId: ${symbolId}`);
            }
        });

        this.connection.on('close', () => {
            console.log('Connection closed, attempting to reconnect...');
            this.stopHeartbeat();
            this.emit('disconnected');
            setTimeout(() => this.connect(), 5000);
        });
        
        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
        });

        try {
            await this.connection.open();
            console.log('Connection opened. Authenticating...');

            await this.connection.sendCommand('ProtoOAApplicationAuthReq', {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            });
            console.log('Application authenticated.');
            
            await this.connection.sendCommand('ProtoOAAccountAuthReq', {
                ctidTraderAccountId: this.ctidTraderAccountId,
                accessToken: this.accessToken,
            });
            console.log('Account authorized.');

            await this.loadAllSymbols();
            this.startHeartbeat();
            this.emit('connected');

        } catch (error) {
            console.error('Failed to connect or authenticate:', error);
            if (this.connection) this.connection.close();
        }
    }

    async loadAllSymbols() {
        console.log('Loading all available symbols...');
        const response = await this.connection.sendCommand('ProtoOASymbolsListReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            includeArchivedSymbols: false,
        });

        response.symbol.forEach(s => {
            // Ensure symbolId is stored as a number when populating the map
            this.symbolMap.set(s.symbolName, s.symbolId.toNumber()); 
            this.reverseSymbolMap.set(s.symbolId.toNumber(), s.symbolName); 
        });
        console.log(`Loaded ${this.symbolMap.size} symbols.`);
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            try {
                if (this.connection) {
                    this.connection.sendCommand('ProtoHeartbeatEvent', {});
                }
            } catch (error) {
                console.error('Failed to send heartbeat:', error);
            }
        }, 10000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    async subscribeToSymbols(symbolNames = []) {
        if (!this.connection) throw new Error("Not connected");
        
        const symbolIds = symbolNames.map(name => this.symbolMap.get(name)).filter(id => id);
        if (symbolIds.length === 0) return;

        await this.connection.sendCommand('ProtoOASubscribeSpotsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: symbolIds,
        });
        console.log(`Sent subscribe request for symbols: ${symbolNames.join(', ')}`);
    }
    
    async unsubscribeFromSymbols(symbolNames = []) {
        if (!this.connection) throw new Error("Not connected");

        const symbolIds = symbolNames.map(name => this.symbolMap.get(name)).filter(id => id);
        if (symbolIds.length === 0) return;

        await this.connection.sendCommand('ProtoOAUnsubscribeSpotsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: symbolIds,
        });
        console.log(`Sent unsubscribe request for symbols: ${symbolNames.join(', ')}`);
    }
}

module.exports = { CTraderSession };
