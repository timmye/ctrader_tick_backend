// Real cTrader tick stream implementation
// Fixed protobuf configuration issue
const { CTraderConnection } = require('@reiryoku/ctrader-layer/build/entry/node/main.js')
require('dotenv').config()

// Validate required environment variables
const requiredEnvVars = ['CTRADER_CLIENT_ID', 'CTRADER_CLIENT_SECRET', 'CTRADER_ACCESS_TOKEN', 'HOST', 'PORT', 'CTRADER_ACCOUNT_ID']
const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '))
  console.error('Please check your .env file')
  process.exit(1)
}

async function startTickStream() {
  try {
    console.log('Starting real cTrader tick stream...')
    
    // Create connection with proper configuration
    const connection = new CTraderConnection({
      host: process.env.HOST,
      port: parseInt(process.env.PORT),
      clientId: process.env.CTRADER_CLIENT_ID,
      clientSecret: process.env.CTRADER_CLIENT_SECRET,
      accessToken: process.env.CTRADER_ACCESS_TOKEN
    })

    // Handle connection events
    connection.on('connect', () => {
      console.log('Connected to cTrader API')
    })

    connection.on('error', (error) => {
      console.error('Connection error:', error.message)
      process.exit(1)
    })

    connection.on('close', () => {
      console.log('Connection closed')
      process.exit(0)
    })

    // Handle spot events using the correct event name
    connection.on('ProtoOASpotEvent', (event) => {
      const tickData = {
        symbol: event.symbolName || 'UNKNOWN',
        bid: event.bid || 0,
        ask: event.ask || 0,
        timestamp: Date.now()
      }
      
      console.log(JSON.stringify(tickData))
    })

    // Open connection and authenticate
    await connection.open()
    console.log('Connection opened successfully')
    
    // Authenticate application
    console.log('Authenticating application...')
    await connection.sendCommand('ProtoOAApplicationAuthReq', {
      clientId: process.env.CTRADER_CLIENT_ID,
      clientSecret: process.env.CTRADER_CLIENT_SECRET
    })
    console.log('Application authenticated')
    
    // Authenticate account
    console.log('Authenticating account...')
    await connection.sendCommand('ProtoOAAccountAuthReq', {
      accessToken: process.env.CTRADER_ACCESS_TOKEN
    })
    console.log('Account authenticated')
    
    // Subscribe to spot prices
    const symbolIds = process.env.CTRADER_SYMBOL_IDS ? 
      process.env.CTRADER_SYMBOL_IDS.split(',').map(id => parseInt(id.trim())) : 
      [1, 2, 3] // Default symbols
    
    console.log('Subscribing to symbols:', symbolIds)
    await connection.sendCommand('ProtoOASubscribeSpotsReq', {
      accountId: parseInt(process.env.CTRADER_ACCOUNT_ID),
      symbolId: symbolIds
    })
    console.log('Subscribed to spot prices')
    
    // Keep connection alive
    setInterval(() => {
      connection.sendHeartbeat().catch(error => {
        console.error('Heartbeat failed:', error.message)
      })
    }, 25000)
    
    console.log('Real tick stream started successfully!')
    
  } catch (error) {
    console.error('Failed to start tick stream:', error.message)
    console.error('Stack trace:', error.stack)
    
    // Provide helpful error message
    if (error.message.includes('payloadType')) {
      console.error('\nThis appears to be a protobuf configuration issue.')
      console.error('Please ensure:')
      console.error('1. Your .env file has all required variables')
      console.error('2. The cTrader-layer library is properly installed')
      console.error('3. You have valid credentials from cTrader')
    }
    
    process.exit(1)
  }
}

// Start the stream
startTickStream()