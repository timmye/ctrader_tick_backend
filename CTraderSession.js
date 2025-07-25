const EventEmitter = require('events');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { CTraderConnection } = require('./cTrader-Layer/build/entry/node/main');

class CTraderSession extends EventEmitter {
    constructor() {
        super();
        console.log('CTraderSession constructor called.'); // Debug log
        this.connection = null;
        this.heartbeatInterval = null;
        // Ensure environment variables are loaded as numbers where expected
        this.ctidTraderAccountId = parseInt(process.env.CTRADER_ACCOUNT_ID, 10);
        this.accessToken = process.env.CTRADER_ACCESS_TOKEN;
        this.clientId = process.env.CTRADER_CLIENT_ID;
        this.clientSecret = process.env.CTRADER_CLIENT_SECRET;
        
        // Maps for symbol data
        this.symbolMap = new Map(); // Name -> ID
        this.reverseSymbolMap = new Map(); // ID -> Name

         console.log('CTraderSession initialized with:'); // Debug log
         console.log('  Account ID:', this.ctidTraderAccountId); // Debug log
         console.log('  Client ID:', this.clientId); // Debug log
         console.log('  Host:', process.env.HOST); // Debug log
         console.log('  Port:', process.env.PORT); // Debug log

    }

    async connect() {
        console.log('CTraderSession connect method called.'); // Debug log
        if (this.connection) {
            console.log('Existing connection found, closing before reconnecting.'); // Debug log
            this.connection.close();
            this.connection = null;
        }
        
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
            console.log('CTraderConnection closed.'); // Debug log
            this.stopHeartbeat();
            this.emit('disconnected');
            // Only attempt reconnect if we were previously connected, not on initial failure
            // This prevents infinite reconnect loops on invalid credentials.
            // If you want auto-reconnect on *any* close, move this logic outside this block.
            // For now, manual reconnect via frontend 'connect' is assumed after initial failure.
            // setTimeout(() => this.connect(), 5000); // Removed automatic reconnect
        });
        
        this.connection.on('error', (err) => {
            console.error('CTraderConnection error:', err); // Debug log
             this.emit('error', err); // Emit error event
        });

        try {
            console.log(`Attempting raw connection to ${process.env.HOST}:${process.env.PORT}...`); // Debug log
            await this.connection.open();
            console.log('Raw connection opened.'); // Debug log

            console.log('Sending ApplicationAuthReq...'); // Debug log
            await this.connection.sendCommand('ProtoOAApplicationAuthReq', {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            });
            console.log('Application authenticated.'); // Debug log
            
            console.log('Sending AccountAuthReq...'); // Debug log
            await this.connection.sendCommand('ProtoOAAccountAuthReq', {
                ctidTraderAccountId: this.ctidTraderAccountId,
                accessToken: this.accessToken,
            });
            console.log('Account authorized.'); // Debug log

            await this.loadAllSymbols();
            this.startHeartbeat();
             console.log('CTraderSession fully connected.'); // Debug log
            this.emit('connected', this.availableSymbols); // Emit with symbols

        } catch (error) {
            console.error('CTraderSession connection/authentication failed:', error); // Debug log
             this.emit('error', error); // Emit error event
            if (this.connection) this.connection.close(); // Ensure connection is closed on error
        }
    }

    // Add a public disconnect method
     disconnect() {
        console.log('CTraderSession disconnect called.'); // Debug log
        this.stopHeartbeat();
        if (this.connection) {
            this.connection.close();
        }
         this.connection = null;
         this.emit('disconnected');
     }

    async loadAllSymbols() {
        console.log('Loading all available symbols...'); // Debug log
        const response = await this.connection.sendCommand('ProtoOASymbolsListReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            includeArchivedSymbols: false,
        });

        // Clear existing maps before repopulating
         this.symbolMap.clear();
         this.reverseSymbolMap.clear();
         this.availableSymbols = []; // Public property to hold available symbols

        response.symbol.forEach(s => {
            // Ensure symbolId is stored as a number when populating the map
            const symbolIdNum = s.symbolId.toNumber();
            this.symbolMap.set(s.symbolName, symbolIdNum); 
            this.reverseSymbolMap.set(symbolIdNum, s.symbolName); 
            this.availableSymbols.push(s.symbolName); // Populate availableSymbols array
        });
        console.log(`Loaded ${this.symbolMap.size} symbols.`); // Debug log
         console.log('Available Symbols:', this.availableSymbols); // Debug log
    }

    startHeartbeat() {
        console.log('Starting heartbeat.'); // Debug log
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            try {
                if (this.connection) {
                     console.log('Sending heartbeat.'); // Debug log
                    this.connection.sendCommand('ProtoHeartbeatEvent', {});
                }
            } catch (error) {
                console.error('Failed to send heartbeat:', error); // Debug log
            }
        }, 10000);
    }

    stopHeartbeat() {
        console.log('Stopping heartbeat.'); // Debug log
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    async subscribeTicks(symbolName) {
        console.log(`Attempting to subscribe ticks for: ${symbolName}`); // Debug log
        if (!this.connection) {
             console.error('Cannot subscribe, not connected.'); // Debug log
            throw new Error("Not connected");
        }
        
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId === undefined) {
             console.warn(`Cannot subscribe, symbol not found: ${symbolName}`); // Debug log
            return; // Symbol not found
        }

         console.log(`Subscribing to symbolId: ${symbolId}`); // Debug log
        await this.connection.sendCommand('ProtoOASubscribeSpotsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: [symbolId],
        });
        console.log(`Sent subscribe request for symbol: ${symbolName}`); // Debug log
    }
    
    async unsubscribeTicks(symbolName) {
         console.log(`Attempting to unsubscribe ticks for: ${symbolName}`); // Debug log
        if (!this.connection) {
             console.error('Cannot unsubscribe, not connected.'); // Debug log
            throw new Error("Not connected");
        }

        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId === undefined) {
             console.warn(`Cannot unsubscribe, symbol not found: ${symbolName}`); // Debug log
            return; // Symbol not found
        }

         console.log(`Unsubscribing from symbolId: ${symbolId}`); // Debug log
        await this.connection.sendCommand('ProtoOAUnsubscribeSpotsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: [symbolId],
        });
        console.log(`Sent unsubscribe request for symbol: ${symbolName}`); // Debug log
    }
}

module.exports = { CTraderSession };
