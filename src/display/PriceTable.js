const blessed = require('blessed');
const contrib = require('blessed-contrib');
const chalk = require('chalk');

class PriceTable {
  constructor(screen) {
    this.screen = screen;
    this.prices = new Map();
    this.table = contrib.table({
      keys: true,
      fg: 'white',
      selectedFg: 'white',
      selectedBg: 'blue',
      interactive: false,
      label: 'Live Prices',
      width: '100%',
      height: '100%',
      border: { type: 'line', fg: 'cyan' },
      columnSpacing: 1,
      columnWidth: [12, 12, 12, 12, 12, 12, 20]
    });
    
    this.screen.append(this.table);
    this.updateHeaders();
  }

  updateHeaders() {
    this.table.setData({
      headers: ['Symbol', 'Bid', 'Ask', 'Spread', 'Change', 'Change %', 'Time'],
      data: []
    });
  }

  updatePrice(symbol, bid, ask, timestamp) {
    const spread = (ask - bid).toFixed(5);
    const change = 0; // Calculate from previous price
    const changePercent = 0;
    
    // Ensure timestamp is a Date object
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const timeString = date.toLocaleTimeString();
    
    this.prices.set(symbol, {
      symbol,
      bid: bid.toFixed(5),
      ask: ask.toFixed(5),
      spread,
      change: change.toFixed(5),
      changePercent: changePercent.toFixed(2) + '%',
      time: timeString
    });

    this.render();
  }

  render() {
    const data = Array.from(this.prices.values())
      .sort((a, b) => a.symbol.localeCompare(b.symbol))
      .map(price => [
        price.symbol,
        this.formatPrice(price.bid, 'bid'),
        this.formatPrice(price.ask, 'ask'),
        price.spread,
        this.formatChange(price.change),
        price.changePercent,
        price.time
      ]);

    this.table.setData({
      headers: ['Symbol', 'Bid', 'Ask', 'Spread', 'Change', 'Change %', 'Time'],
      data: data
    });

    this.screen.render();
  }

  formatPrice(price, type) {
    const num = parseFloat(price);
    if (type === 'bid') {
      return chalk.green(num.toFixed(5));
    } else {
      return chalk.red(num.toFixed(5));
    }
  }

  formatChange(change) {
    const num = parseFloat(change);
    if (num > 0) {
      return chalk.green('+' + num.toFixed(5));
    } else if (num < 0) {
      return chalk.red(num.toFixed(5));
    }
    return chalk.gray(num.toFixed(5));
  }

  clear() {
    this.prices.clear();
    this.render();
  }

  removeSymbol(symbol) {
    this.prices.delete(symbol);
    this.render();
  }
}

module.exports = { PriceTable };