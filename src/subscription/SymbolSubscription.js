const EventEmitter = require('events');
const { CTraderConnection } = require('@reiryoku/ctrader-layer');

class SymbolSubscription extends EventEmitter {
  constructor(connection, accessToken) {
    super();
    this.connection = connection;
    this.accessToken = accessToken;
    this.subscribedSymbols = new Set();
    this.isConnected = false;
    
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.connection.on('message', (message) => {
      this.handleMessage(message);
    });

    this.connection.on('error', (error) => {
      this.emit('error', error);
    });
  }

  async subscribe(symbol) {
    try {
      if (this.subscribedSymbols.has(symbol)) {
        return { success: true, message: 'Already subscribed' };
      }

      // Send subscription request
      const subscriptionRequest = {
        type: 'SUBSCRIBE_SYMBOL',
        symbol: symbol,
        accessToken: this.accessToken
      };

      await this.connection.send(subscriptionRequest);
      this.subscribedSymbols.add(symbol);
      
      return { success: true, message: `Subscribed to ${symbol}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async unsubscribe(symbol) {
    try {
      if (!this.subscribedSymbols.has(symbol)) {
        return { success: true, message: 'Not subscribed' };
      }

      const unsubscribeRequest = {
        type: 'UNSUBSCRIBE_SYMBOL',
        symbol: symbol,
        accessToken: this.accessToken
      };

      await this.connection.send(unsubscribeRequest);
      this.subscribedSymbols.delete(symbol);
      
      return { success: true, message: `Unsubscribed from ${symbol}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  handleMessage(message) {
    if (message.type === 'TICK' && message.symbol) {
      this.emit('tick', {
        symbol: message.symbol,
        bid: message.bid,
        ask: message.ask,
        timestamp: new Date(message.timestamp)
      });
    }
  }

  getSubscribedSymbols() {
    return Array.from(this.subscribedSymbols);
  }

  isSubscribed(symbol) {
    return this.subscribedSymbols.has(symbol);
  }
}

module.exports = { SymbolSubscription };