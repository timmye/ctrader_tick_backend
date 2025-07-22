#!/usr/bin/env node

const { Command } = require('commander');
const { SymbolSubscription } = require('../src/subscription/SymbolSubscription');
const { TerminalDisplay } = require('../src/display/TerminalDisplay');
const { CTraderConnection } = require('@reiryoku/ctrader-layer');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const program = new Command();

program
  .name('live-display')
  .description('Display live prices in terminal')
  .version('1.0.0');

program
  .option('-s, --symbols <symbols>', 'Comma-separated symbols to display')
  .option('-i, --interval <ms>', 'Update interval in milliseconds', '100')
  .action(async (options) => {
    try {
      const connection = await createConnection();
      const display = new TerminalDisplay({
        updateInterval: parseInt(options.interval)
      });

      let symbols = [];
      if (options.symbols) {
        symbols = options.symbols.split(',').map(s => s.trim().toUpperCase());
      } else {
        // Load default symbols
        const defaultSymbols = loadDefaultSymbols();
        symbols = defaultSymbols;
      }

      // Convert symbol names to IDs
      const symbolMap = {
        'EURUSD': 1,
        'GBPUSD': 2,
        'USDJPY': 3,
        'USDCHF': 4,
        'AUDUSD': 5,
        'USDCAD': 6,
        'NZDUSD': 7,
        'EURGBP': 8,
        'EURJPY': 9,
        'GBPJPY': 10,
        'XAUUSD': 41,
        'BTCUSD': 101
      };

      const symbolIds = symbols.map(symbol => symbolMap[symbol] || parseInt(symbol)).filter(id => !isNaN(id));

      // Subscribe to tick data
      await connection.sendCommand(2127, {
        ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID),
        symbolId: symbolIds
      });
      console.log(`✓ Subscribed to symbols: ${symbols.join(', ')}`);

      // Setup display
      display.start();

      // Handle tick updates
      connection.on(2131, (tickData) => {
        const symbol = Object.keys(symbolMap).find(key => symbolMap[key] === tickData.symbolId) || `SYMBOL_${tickData.symbolId}`;
        display.updatePrice(
          symbol,
          tickData.bid / 100000,
          tickData.ask / 100000,
          new Date().toISOString()
        );
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\nShutting down...');
        display.stop();
        connection.close();
        process.exit(0);
      });

      console.log('\n🚀 Live display started. Press Ctrl+C to stop.\n');

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

async function createConnection() {
  // Validate required environment variables
  const requiredEnvVars = ['CTRADER_CLIENT_ID', 'CTRADER_CLIENT_SECRET', 'CTRADER_ACCESS_TOKEN', 'CTRADER_ACCOUNT_ID'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const connection = new CTraderConnection({
    host: process.env.HOST || 'live.ctraderapi.com',
    port: parseInt(process.env.PORT) || 5035
  });
  
  await connection.open();
  
  // Application authentication
  await connection.sendCommand(2100, {
    clientId: process.env.CTRADER_CLIENT_ID,
    clientSecret: process.env.CTRADER_CLIENT_SECRET
  });
  
  // Account authentication
  await connection.sendCommand(2102, {
    accessToken: process.env.CTRADER_ACCESS_TOKEN,
    ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID)
  });
  
  return connection;
}

function loadDefaultSymbols() {
  try {
    const configPath = require('path').join(__dirname, '../config/default-symbols.json');
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'];
  }
}

program.parse();