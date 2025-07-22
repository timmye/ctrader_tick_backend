# Function Signatures and Data Structures

## cTrader-Layer API

### CTraderConnection Class
```javascript
// Constructor
new CTraderConnection({ host: string, port: number })

// Connection Methods
await connection.open() // Returns Promise<void>

// Command Methods
await connection.sendCommand(payloadType: string|number, data?: object) // Returns Promise<object>
await connection.trySendCommand(payloadType: string|number, data?: object) // Returns Promise<object|undefined>

// Event Methods
connection.on(eventType: string|number, callback: (data: object) => void) // Returns this
connection.sendHeartbeat() // Returns void

// Static Methods
await CTraderConnection.getAccessTokenProfile(accessToken: string) // Returns Promise<object>
await CTraderConnection.getAccessTokenAccounts(accessToken: string) // Returns Promise<object[]>
```

## Message Payload Types (from ProtoOAPayloadType enum)

### Authentication
- **PROTO_OA_APPLICATION_AUTH_REQ**: 2100
- **PROTO_OA_APPLICATION_AUTH_RES**: 2101
- **PROTO_OA_ACCOUNT_AUTH_REQ**: 2102
- **PROTO_OA_ACCOUNT_AUTH_RES**: 2103

### Tick Streaming
- **PROTO_OA_SUBSCRIBE_SPOTS_REQ**: 2127
- **PROTO_OA_SUBSCRIBE_SPOTS_RES**: 2128
- **PROTO_OA_UNSUBSCRIBE_SPOTS_REQ**: 2129
- **PROTO_OA_UNSUBSCRIBE_SPOTS_RES**: 2130
- **PROTO_OA_SPOT_EVENT**: 2131

## Data Structures

### ProtoOAApplicationAuthReq
```javascript
{
  clientId: string,
  clientSecret: string
}
```

### ProtoOAAccountAuthReq
```javascript
{
  accessToken: string,
  ctidTraderAccountId: number
}
```

### ProtoOASubscribeSpotsReq
```javascript
{
  ctidTraderAccountId: number,
  symbolId: number[]
}
```

### ProtoOASpotEvent (Tick Data)
```javascript
{
  ctidTraderAccountId: number,
  symbolId: number,
  bid: number,        // Price in 1/100,000 units
  ask: number,        // Price in 1/100,000 units
  timestamp: number   // Unix timestamp in milliseconds
}
```

## Price Format
- **Precision**: 1/100,000 units
- **Example**: 1.23456 = 123,456 units
- **Conversion**: price / 100,000 = actual price

## Connection Parameters
```javascript
const connection = new CTraderConnection({
  host: "live.ctraderapi.com",  // or "demo.ctraderapi.com"
  port: 5035                    // SSL port
})
```

## Environment Variables
```javascript
process.env.CTRADER_CLIENT_ID        // string
process.env.CTRADER_CLIENT_SECRET    // string
process.env.CTRADER_ACCESS_TOKEN     // string
process.env.CTRADER_ACCOUNT_ID       // number (as string)
```

## Error Handling
- **Connection errors**: Thrown by connection.open()
- **Command errors**: Rejected promises with errorCode field
- **Network errors**: Socket-level events