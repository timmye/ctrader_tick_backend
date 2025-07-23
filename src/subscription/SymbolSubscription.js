const EventEmitter = require('events');
const { ProtoOAPayloadType } = require('@reiryoku/ctrader-layer');

class SymbolSubscription extends EventEmitter {
    constructor(connection) {
        super();
        this.connection = connection;
        this.subscribedSymbols = new Map();

        this.connection.on(ProtoOAPayloadType.PROTO_OA_SPOT_EVENT, (message) => {
            this.handleTick(message.payload);
        });
    }

    async subscribe(symbolName, symbolId) {
        if (this.subscribedSymbols.has(symbolName)) return;

        try {
            await this.connection.sendCommand(2127, {
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
            await this.connection.sendCommand(2128, {
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
