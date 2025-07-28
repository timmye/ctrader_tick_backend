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
        this.ctidTraderAccountId = Number(process.env.CTRADER_ACCOUNT_ID);
        this.accessToken = process.env.CTRADER_ACCESS_TOKEN;
        this.clientId = process.env.CTRADER_CLIENT_ID;
        this.clientSecret = process.env.CTRADER_CLIENT_SECRET;
        
        this.symbolMap = new Map();
        this.reverseSymbolMap = new Map();
        this.symbolInfoCache = new Map(); // Cache for full symbol details
    }

    async connect() {
        if (this.connection) {
            this.connection.close();
        }
        
        this.connection = new CTraderConnection({
            host: process.env.HOST,
            port: Number(process.env.PORT),
        });

        this.connection.on('PROTO_OA_SPOT_EVENT', async (event) => {
            const symbolId = Number(event.symbolId);
            const symbolInfo = await this.getFullSymbolInfo(symbolId);

            if (symbolInfo && event.bid && event.ask) {
                const divisor = 100000;
                const tick = {
                    symbol: symbolInfo.symbolName,
                    bid: Number(event.bid) / divisor,
                    ask: Number(event.ask) / divisor,
                    timestamp: Date.now(),
                };
                this.emit('tick', tick);
            }
        });
        
        this.connection.on('close', () => this.handleDisconnect());
        this.connection.on('error', (err) => console.error('CTraderConnection error:', err));

        try {
            await this.connection.open();
            await this.connection.sendCommand('ProtoOAApplicationAuthReq', { clientId: this.clientId, clientSecret: this.clientSecret });
            await this.connection.sendCommand('ProtoOAAccountAuthReq', { ctidTraderAccountId: this.ctidTraderAccountId, accessToken: this.accessToken });
            await this.loadAllSymbols();
            this.startHeartbeat();
            this.emit('connected', Array.from(this.symbolMap.keys()));
        } catch (error) {
            this.handleDisconnect(error);
        }
    }
    
    handleDisconnect(error = null) {
        if(error) console.error('CTraderSession connection failed:', error);
        console.log('CTraderConnection closed.');
        this.stopHeartbeat();
        this.emit('disconnected');
        if (this.connection) this.connection.close();
    }

    async loadAllSymbols() {
        const response = await this.connection.sendCommand('ProtoOASymbolsListReq', { ctidTraderAccountId: this.ctidTraderAccountId });
        response.symbol.forEach(s => {
            this.symbolMap.set(s.symbolName, Number(s.symbolId));
            this.reverseSymbolMap.set(Number(s.symbolId), s.symbolName);
        });
        console.log(`Loaded ${this.symbolMap.size} light symbols.`);
    }

    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.connection) this.connection.sendCommand('ProtoHeartbeatEvent', {});
        }, 10000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    }

    async getFullSymbolInfo(symbolId) {
        if (this.symbolInfoCache.has(symbolId)) {
            return this.symbolInfoCache.get(symbolId);
        }
        const response = await this.connection.sendCommand('ProtoOASymbolByIdReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId: [symbolId] });
        if (!response.symbol || response.symbol.length === 0) {
            throw new Error(`Failed to fetch full details for symbol ID ${symbolId}`);
        }
        const fullInfo = response.symbol[0];
        const processedInfo = {
            symbolName: fullInfo.symbolName,
            digits: Number(fullInfo.digits),
        };
        this.symbolInfoCache.set(symbolId, processedInfo);
        return processedInfo;
    }

    async getSymbolDataPackage(symbolName, adrLookbackDays = 14) {
        const symbolId = this.symbolMap.get(symbolName);
        if (!symbolId) throw new Error(`Symbol not found in map: ${symbolName}`);
        
        const symbolInfo = await this.getFullSymbolInfo(symbolId);
        const { digits } = symbolInfo;
        const divisor = 100000;

        const to = moment.utc().valueOf();
        const from = moment.utc().subtract(adrLookbackDays + 5, 'days').valueOf();
        const dailyBarsData = await this.connection.sendCommand('ProtoOAGetTrendbarsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId, period: 'D1', fromTimestamp: from, toTimestamp: to });

        if (!dailyBarsData.trendbar || dailyBarsData.trendbar.length < 2) throw new Error(`Not enough historical data for ${symbolName}`);
        
        const bars = dailyBarsData.trendbar;
        const todaysBar = bars[bars.length - 1];
        
        const todaysOpen = (Number(todaysBar.low) + Number(todaysBar.deltaOpen)) / divisor;
        const todaysLow = Number(todaysBar.low) / divisor;
        const todaysHigh = (Number(todaysBar.low) + Number(todaysBar.deltaHigh)) / divisor;
        const initialPrice = (Number(todaysBar.low) + Number(todaysBar.deltaClose)) / divisor;

        const adrBars = bars.slice(Math.max(0, bars.length - 1 - adrLookbackDays), bars.length - 1);
        const adrRanges = adrBars.map(bar => Number(bar.deltaHigh) / divisor);
        const adr = adrRanges.length > 0 ? adrRanges.reduce((sum, range) => sum + range, 0) / adrRanges.length : 0;
        
        return {
            symbol: symbolName,
            digits,
            adr,
            todaysOpen,
            todaysHigh,
            todaysLow,
            projectedHigh: todaysOpen + (adr / 2),
            projectedLow: todaysOpen - (adr / 2),
            initialPrice,
            initialMarketProfile: [],
        };
    }

    async subscribeToTicks(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId) await this.connection.sendCommand('ProtoOASubscribeSpotsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId: [symbolId] });
    }
    
    async unsubscribeFromTicks(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId) await this.connection.sendCommand('ProtoOAUnsubscribeSpotsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId: [symbolId] });
    }
}

module.exports = { CTraderSession };
