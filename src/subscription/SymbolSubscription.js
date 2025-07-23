const EventEmitter = require('events');

class SymbolSubscription extends EventEmitter {
    constructor(connection) {
        super();
        this.connection = connection;
        this.subscribedSymbols = new Map();
    }

    async subscribe(symbolName, symbolId) {
        if (this.subscribedSymbols.has(symbolName)) return;

        try {
            await this.connection.sendCommand('ProtoOASubscribeSpotsReq', {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
                symbolId: [symbolId],
            });
            this.subscribedSymbols.set(symbolName, symbolId);
            this.emit('subscribed', { symbolName });
        } catch (error) {
            this.emit('error', { symbolName, error });
        }
    }

    async unsubscribe(symbolName) {
        const symbolId = this.subscribedSymbols.get(symbolName);
        if (!symbolId) return;

        try {
            await this.connection.sendCommand('ProtoOAUnsubscribeSpotsReq', {
                ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
                symbolId: [symbolId],
            });
            this.subscribedSymbols.delete(symbolName);
            this.emit('unsubscribed', { symbolName });
        } catch (error) {
            this.emit('error', { symbolName, error });
        }
    }

    handleTick(tick) {
        // Find the symbol name from the tick's symbolId
        // This is a bit inefficient, but necessary because the tick event doesn't contain the symbol name
        for (const [symbolName, symbolId] of this.subscribedSymbols.entries()) {
            if (tick.symbolId === symbolId) {
                this.emit('tick', {
                    symbol: symbolName,
                    bid: tick.bid / 100000,
                    ask: tick.ask / 100000,
                    timestamp: Date.now(),
                });
                break;
            }
        }
    }
}

module.exports = SymbolSubscription;
