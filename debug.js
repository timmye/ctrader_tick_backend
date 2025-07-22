#!/usr/bin/env node

const { SymbolSubscription } = require('./src/subscription/SymbolSubscription');
const { CTraderConnection } = require('@reiryoku/ctrader-layer');

async function debug() {
  try {
    console.log('Creating connection...');
    const connection = new CTraderConnection({
      host: process.env.HOST || 'demo.ctraderapi.com',
      port: parseInt(process.env.PORT) || 5035
    });
    
    console.log('Opening connection...');
    await connection.open();
    
    console.log('Creating subscription...');
    const subscription = new SymbolSubscription(connection, process.env.CTRADER_ACCESS_TOKEN);
    
    console.log('Subscribing to USDJPY...');
    const result = await subscription.subscribe('USDJPY');
    console.log('Result:', result);
    
    connection.close();
  } catch (error) {
    console.error('Full error:', error);
    console.error('Stack:', error.stack);
  }
}

debug();