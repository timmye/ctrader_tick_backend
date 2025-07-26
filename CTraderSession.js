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
        this.symbolInfoMap = new Map(); // Will cache full symbol info on-demand
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

            if (symbolInfo && event.bid?.low && event.ask?.low) {
                const tick = {
                    symbol: symbolInfo.symbolName,
                    bid: event.bid.low / Math.pow(10, symbolInfo.digits),
                    ask: event.ask.low / Math.pow(10, symbolInfo.digits),
                    timestamp: Date.now(),
                };
                this.emit('tick', tick);
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
        this.symbolInfoMap.clear(); // Will be populated on-demand

        response.symbol.forEach(s => {
            const symbolIdNum = s.symbolId.toNumber();
            this.symbolMap.set(s.symbolName, symbolIdNum);
            this.reverseSymbolMap.set(symbolIdNum, s.symbolName);
        });
        console.log(`Loaded ${this.symbolMap.size} light symbols.`);
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
        try {
            const symbolId = this.symbolMap.get(symbolName);
            if (!symbolId) {
                throw new Error(`Invalid symbol: ${symbolName}`);
            }
            
            let symbolInfo = this.symbolInfoMap.get(symbolId);
            if (!symbolInfo) {
                console.log(`[CTraderSession] Cache miss for ${symbolName} (ID: ${symbolId}). Fetching full symbol data...`);
                const response = await this.connection.sendCommand('ProtoOASymbolByIdReq', {
                    ctidTraderAccountId: this.ctidTraderAccountId,
                    symbolId: [symbolId],
                });

                if (!response.symbol || response.symbol.length === 0) {
                    throw new Error(`Failed to fetch full details for symbol ID ${symbolId}`);
                }
                symbolInfo = response.symbol[0];
                this.symbolInfoMap.set(symbolId, symbolInfo);
            }
            
            console.log('[CTraderSession] Using SymbolInfo:', JSON.stringify(symbolInfo, null, 2));
            const divisor = Math.pow(10, symbolInfo.digits);
            console.log(`[CTraderSession] Divisor: ${divisor} (from digits: ${symbolInfo.digits})`);
            if (isNaN(divisor) || divisor === 0) {
                throw new Error(`Invalid divisor calculated for symbol ${symbolName}. Digits: ${symbolInfo.digits}`);
            }

            const to = moment.utc().valueOf();
            const from = moment.utc().subtract(8, 'days').valueOf();

            const dailyBars = await this.getTrendbars(symbolId, 'D1', from, to);
            console.log('[CTraderSession] RAW BARS:', JSON.stringify(dailyBars, null, 2));

            if (!dailyBars || dailyBars.length < 6) {
                 throw new Error(`Not enough historical data. Expected at least 6 daily bars, got ${dailyBars?.length || 0}`);
            }
            
            const todaysBar = dailyBars[dailyBars.length - 1];
            
            if (todaysBar?.low?.low === undefined || todaysBar?.deltaOpen?.low === undefined) {
                throw new Error(`Today's bar has invalid or missing price components. Bar: ${JSON.stringify(todaysBar)}`);
            }
            
            const todaysOpen = (todaysBar.low.low + todaysBar.deltaOpen.low) / divisor;

            const adrBars = dailyBars.slice(dailyBars.length - 6, dailyBars.length - 1);
            const adrRanges = [];
            
            for (const bar of adrBars) {
                if (bar?.low?.low !== undefined && bar?.deltaHigh?.low !== undefined) {
                    const low = bar.low.low;
                    const high = low + bar.deltaHigh.low;
                    adrRanges.push((high / divisor) - (low / divisor));
                }
            }

            if (adrRanges.length < 5) {
                throw new Error(`Could not calculate ADR from enough bars. Found ${adrRanges.length} valid bars.`);
            }

            const adr = adrRanges.reduce((sum, range) => sum + range, 0) / adrRanges.length;
            
            const projectedHigh = todaysOpen + (adr / 2);
            const projectedLow = todaysOpen - (adr / 2);

            const dataPackage = {
                symbol: symbolName,
                adr,
                todaysOpen,
                projectedHigh,
                projectedLow,
            };

            console.log('[CTraderSession] Successfully created data package:', dataPackage);
            return dataPackage;

        } catch (error) {
            console.error(`[CTraderSession] FAILED to get symbol data package for ${symbolName}:`, error.message);
            // Re-throw the original error so the WebSocket server can catch it and notify the client
            throw error;
        }
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
