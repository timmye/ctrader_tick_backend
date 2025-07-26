const EventEmitter = require('events');
const path = require('path');
const moment = require('moment');
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
        
        this.symbolMap = new Map();
        this.reverseSymbolMap = new Map();
        this.symbolInfoMap = new Map();
    }

    async connect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        
        this.connection = new CTraderConnection({
            host: process.env.HOST,
            port: parseInt(process.env.PORT, 10),
        });

        this.connection.on('PROTO_OA_SPOT_EVENT', (event) => {
            const symbolId = event.symbolId.toNumber();
            const symbolInfo = this.symbolInfoMap.get(symbolId);
// 
            if (symbolInfo) {
                const tick = {
                    symbol: symbolInfo.symbolName,
                    bid: event.bid / Math.pow(10, symbolInfo.digits),
                    ask: event.ask / Math.pow(10, symbolInfo.digits),
                    timestamp: Date.now(),
                };
                this.emit('tick', tick);
            } else {
                console.warn(`Received tick for unknown symbolId: ${symbolId}`);
            }
        });

        this.connection.on('close', () => {
            console.log('CTraderConnection closed.');
            this.stopHeartbeat();
            this.emit('disconnected');
        });
        
        this.connection.on('error', (err) => {
            console.error('CTraderConnection error:', err);
            this.emit('error', err);
        });

        try {
            await this.connection.open();
            await this.connection.sendCommand('ProtoOAApplicationAuthReq', {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            });
            await this.connection.sendCommand('ProtoOAAccountAuthReq', {
                ctidTraderAccountId: this.ctidTraderAccountId,
                accessToken: this.accessToken,
            });

            await this.loadAllSymbols();
            this.startHeartbeat();
            this.emit('connected', Array.from(this.symbolMap.keys()));
        } catch (error) {
            console.error('CTraderSession connection/authentication failed:', error);
            this.emit('error', error);
            if (this.connection) this.connection.close();
        }
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.connection) {
            this.connection.close();
        }
        this.connection = null;
        this.emit('disconnected');
    }

    async loadAllSymbols() {
        const response = await this.connection.sendCommand('ProtoOASymbolsListReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
        });

        this.symbolMap.clear();
        this.reverseSymbolMap.clear();
        this.symbolInfoMap.clear();

        response.symbol.forEach(s => {
            const symbolIdNum = s.symbolId.toNumber();
            this.symbolMap.set(s.symbolName, symbolIdNum);
            this.reverseSymbolMap.set(symbolIdNum, s.symbolName);
            this.symbolInfoMap.set(symbolIdNum, s);
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
    
    async getTrendbars(symbolId, period, from, to) {
        const response = await this.connection.sendCommand('ProtoOAGetTrendbarsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: symbolId,
            period: period,
            fromTimestamp: from,
            toTimestamp: to,
        });
        return response.trendbar;
    }

    async getSymbolDataPackage(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (!symbolId) throw new Error(`Symbol ${symbolName} not found.`);
        
        const symbolInfo = this.symbolInfoMap.get(symbolId);
        const divisor = Math.pow(10, symbolInfo.digits);

        const to = moment.utc().endOf('day').valueOf();
        const from = moment.utc(to).subtract(8, 'days').startOf('day').valueOf();
        const dailyBars = await this.getTrendbars(symbolId, 'D1', from, to);

        if (dailyBars.length < 6) {
             throw new Error(`Not enough historical data. Expected at least 6 daily bars, got ${dailyBars.length}`);
        }
        
        const adrBars = dailyBars.slice(-6, -1);
        const adr = adrBars.reduce((sum, bar) => {
            const high = (bar.open + bar.deltaHigh) / divisor;
            const low = (bar.open + bar.deltaLow) / divisor;
            return sum + (high - low);
        }, 0) / adrBars.length;
        
        const todaysBar = dailyBars[dailyBars.length - 1];
        const todaysOpen = todaysBar.open / divisor;
        const projectedHigh = todaysOpen + (adr / 2);
        const projectedLow = todaysOpen - (adr / 2);

        const todayStart = moment.utc().startOf('day').valueOf();
        const now = moment.utc().valueOf();
        const minuteBars = await this.getTrendbars(symbolId, 'M1', todayStart, now);

        const initialMarketProfile = minuteBars.map(bar => ({
            price: bar.open / divisor,
            volume: bar.volume,
        }));
        
        return {
            symbol: symbolName,
            adr,
            todaysOpen,
            projectedHigh,
            projectedLow,
            initialMarketProfile,
        };
    }

    async subscribeToTicks(symbolName) {
        if (!this.connection) throw new Error("Not connected");
        
        const symbolId = this.symbolMap.get(symbolName);
        if (!symbolId) {
            console.warn(`Cannot subscribe, symbol not found: ${symbolName}`);
            return;
        }

        await this.connection.sendCommand('ProtoOASubscribeSpotsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: [symbolId],
        });
        console.log(`Successfully subscribed to ticks for ${symbolName}`);
    }
    
    async unsubscribeFromTicks(symbolName) {
        if (!this.connection) throw new Error("Not connected");

        const symbolId = this.symbolMap.get(symbolName);
        if (!symbolId) {
             console.warn(`Cannot unsubscribe, symbol not found: ${symbolName}`);
            return;
        }

        await this.connection.sendCommand('ProtoOAUnsubscribeSpotsReq', {
            ctidTraderAccountId: this.ctidTraderAccountId,
            symbolId: [symbolId],
        });
        console.log(`Sent unsubscribe request for ${symbolName}`);
    }
}

module.exports = { CTraderSession };
