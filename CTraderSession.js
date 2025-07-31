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
        this.symbolInfoCache = new Map();
    }

    /**
     * Calculates the actual price from a raw integer value based on cTrader's documentation.
     * @param {number} rawValue The raw integer price from the API.
     * @param {number} digits The number of decimal places for the symbol.
     * @returns {number} The correctly calculated and rounded price.
     */
    calculatePrice(rawValue, digits) {
        if (typeof rawValue !== 'number') return 0;
        const price = rawValue / 100000.0;
        return Number(price.toFixed(digits));
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
            // E2E_DEBUG: Keep for end-to-end diagnosis until production deployment.
            console.log(`[DEBUG_TRACE | CTraderSession] Raw ProtoOASpotEvent received:`, JSON.stringify(event));

            const symbolId = Number(event.symbolId);
            if (!symbolId) return;

            const symbolName = this.reverseSymbolMap.get(symbolId);
            if (!symbolName) return;

            const symbolInfo = await this.getFullSymbolInfo(symbolId);
            if (!symbolInfo) return;

            let tickData = null;

            if (event.trendbar && event.trendbar.length > 0) {
                const latestBar = event.trendbar[event.trendbar.length - 1];
                const closePriceRaw = Number(latestBar.low) + Number(latestBar.deltaClose);
                const price = this.calculatePrice(closePriceRaw, symbolInfo.digits);
                const timestamp = latestBar.utcTimestampInMinutes ? Number(latestBar.utcTimestampInMinutes) * 60 * 1000 : Date.now();

                tickData = {
                    symbol: symbolName,
                    bid: price,
                    ask: price,
                    timestamp: timestamp,
                };
            } 
            else if (event.bid != null) {
                const bidRaw = Number(event.bid);
                const askRaw = (event.ask != null) ? Number(event.ask) : bidRaw;
                const timestamp = event.timestamp ? Number(event.timestamp) : Date.now();

                tickData = {
                    symbol: symbolName,
                    bid: this.calculatePrice(bidRaw, symbolInfo.digits),
                    ask: this.calculatePrice(askRaw, symbolInfo.digits),
                    timestamp: timestamp,
                };
            }

            if (tickData) {
                // E2E_DEBUG: Keep for end-to-end diagnosis until production deployment.
                console.log(`[DEBUG_TRACE | CTraderSession] Emitting processed tick:`, JSON.stringify(tickData));
                this.emit('tick', tickData);
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

    const to = moment.utc().valueOf();
    const fromDaily = moment.utc().subtract(adrLookbackDays + 5, 'days').valueOf();
    const fromIntraday = moment.utc().startOf('day').valueOf();

    const [dailyBarsData, intradayBarsData] = await Promise.all([
        this.connection.sendCommand('ProtoOAGetTrendbarsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId, period: 'D1', fromTimestamp: fromDaily, toTimestamp: to }),
        this.connection.sendCommand('ProtoOAGetTrendbarsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId, period: 'M1', fromTimestamp: fromIntraday, toTimestamp: to })
    ]);

    if (!dailyBarsData.trendbar || dailyBarsData.trendbar.length < 2) throw new Error(`Not enough daily bars for ADR calculation on ${symbolName}`);

    const dailyBars = dailyBarsData.trendbar;
    const adrBars = dailyBars.slice(Math.max(0, dailyBars.length - 1 - adrLookbackDays), dailyBars.length - 1);
    const adrRanges = adrBars.map(bar => this.calculatePrice(Number(bar.deltaHigh) || 0, digits));
    const adr = adrRanges.length > 0 ? adrRanges.reduce((sum, range) => sum + range, 0) / adrRanges.length : 0;
    
    let todaysOpen, todaysHigh, todaysLow, initialPrice, initialMarketProfile;

    const m1Bars = intradayBarsData.trendbar;

    if (!m1Bars || m1Bars.length === 0) {
        const lastDailyBar = dailyBars[dailyBars.length - 1];
        todaysOpen = this.calculatePrice(Number(lastDailyBar.low) + Number(lastDailyBar.deltaOpen), digits);
        todaysHigh = this.calculatePrice(Number(lastDailyBar.low) + Number(lastDailyBar.deltaHigh), digits);
        todaysLow = this.calculatePrice(Number(lastDailyBar.low), digits);
        initialPrice = this.calculatePrice(Number(lastDailyBar.low) + Number(lastDailyBar.deltaClose), digits);
        initialMarketProfile = [];
    } else {
        const processedM1Bars = m1Bars.map(bar => ({
            open: this.calculatePrice(Number(bar.low) + Number(bar.deltaOpen), digits),
            high: this.calculatePrice(Number(bar.low) + Number(bar.deltaHigh), digits),
            low: this.calculatePrice(Number(bar.low), digits),
            close: this.calculatePrice(Number(bar.low) + Number(bar.deltaClose), digits),
            timestamp: Number(bar.utcTimestampInMinutes) * 60 * 1000
        }));

        todaysOpen = processedM1Bars[0].open;
        todaysHigh = Math.max(...processedM1Bars.map(b => b.high));
        todaysLow = Math.min(...processedM1Bars.map(b => b.low));
        initialPrice = processedM1Bars[processedM1Bars.length - 1].close;
        initialMarketProfile = processedM1Bars;
    }

    const finalPackage = {
        symbol: symbolName,
        digits,
        adr,
        todaysOpen,
        todaysHigh,
        todaysLow,
        projectedAdrHigh: todaysOpen + (adr / 2),
        projectedAdrLow: todaysOpen - (adr / 2),
        initialPrice,
        initialMarketProfile,
    };
    
    return finalPackage;
}

    async subscribeToTicks(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId) {
            await this.connection.sendCommand('ProtoOASubscribeSpotsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId: [symbolId] });
        }
    }
    
    async unsubscribeFromTicks(symbolName) {
        const symbolId = this.symbolMap.get(symbolName);
        if (symbolId) await this.connection.sendCommand('ProtoOAUnsubscribeSpotsReq', { ctidTraderAccountId: this.ctidTraderAccountId, symbolId: [symbolId] });
    }
}

module.exports = { CTraderSession };
