# Additional Dependencies for Symbol Subscription & Terminal Display

## Terminal Display Dependencies
```json
{
  "dependencies": {
    "blessed": "^0.1.81",
    "blessed-contrib": "^4.11.0",
    "chalk": "^4.1.2",
    "cli-table3": "^0.6.3",
    "commander": "^9.4.1",
    "inquirer": "^8.2.5"
  }
}
```

## Install Commands (PowerShell)
```powershell
# Install terminal display dependencies
npm install blessed@^0.1.81 blessed-contrib@^4.11.0 chalk@^4.1.2 cli-table3@^0.6.3 commander@^9.4.1 inquirer@^8.2.5

# Install as exact versions
npm install --save-exact blessed@0.1.81 blessed-contrib@4.11.0 chalk@4.1.2 cli-table3@0.6.3 commander@9.4.1 inquirer@8.2.5
```

## Updated package.json
```json
{
  "name": "ticks_v7",
  "version": "1.0.0",
  "description": "cTrader tick streaming with symbol subscription",
  "main": "stream.js",
  "scripts": {
    "start": "node stream.js",
    "subscribe": "node bin/subscribe.js",
    "display": "node bin/live-display.js"
  },
  "dependencies": {
    "@reiryoku/ctrader-layer": "1.3.0",
    "dotenv": "16.0.0",
    "blessed": "0.1.81",
    "blessed-contrib": "4.11.0",
    "chalk": "4.1.2",
    "cli-table3": "0.6.3",
    "commander": "9.4.1",
    "inquirer": "8.2.5"
  }
}