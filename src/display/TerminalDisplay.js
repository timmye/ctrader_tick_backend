const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { PriceTable } = require('./PriceTable');

class TerminalDisplay {
  constructor(options = {}) {
    this.options = {
      updateInterval: options.updateInterval || 100,
      maxRows: options.maxRows || 20,
      ...options
    };
    
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'cTrader Live Prices'
    });
    
    this.priceTable = new PriceTable(this.screen);
    this.isRunning = false;
    this.updateTimer = null;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.setupKeyHandlers();
    
    // Initial render
    this.screen.render();
    
    console.log('Terminal display started. Press Ctrl+C to exit.');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.screen.destroy();
  }

  setupKeyHandlers() {
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.stop();
      process.exit(0);
    });
    
    this.screen.key(['r'], () => {
      this.priceTable.clear();
    });
  }

  updatePrice(symbol, bid, ask, timestamp) {
    this.priceTable.updatePrice(symbol, bid, ask, timestamp);
  }

  removeSymbol(symbol) {
    this.priceTable.removeSymbol(symbol);
  }

  clear() {
    this.priceTable.clear();
  }
}

module.exports = { TerminalDisplay };