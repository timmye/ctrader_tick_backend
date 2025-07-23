const { CTraderConnection, ProtoOAPayloadType } = require('@reiryoku/ctrader-layer');
const logger = require('./logger');
require('dotenv').config();

async function main() {
    const connection = new CTraderConnection({
        host: process.env.HOST || 'demo.ctraderapi.com',
        port: parseInt(process.env.PORT, 10) || 5035,
    });

    connection.on('error', (error) => {
        logger.error('Connection error:', error);
    });

    connection.on(ProtoOAPayloadType.PROTO_OA_SPOT_EVENT, (message) => {
        logger.info('Received tick data:', message.payload);
    });

    try {
        await connection.open();
        logger.info('Connection opened');

        await connection.sendCommand(2100, {
            clientId: process.env.CTRADER_CLIENT_ID,
            clientSecret: process.env.CTRADER_CLIENT_SECRET,
        });
        logger.info('Application authorized');

        await connection.sendCommand(2102, {
            accessToken: process.env.CTRADER_ACCESS_TOKEN,
            ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
        });
        logger.info('Account authorized');

        await connection.sendCommand(2127, {
            ctidTraderAccountId: parseInt(process.env.CTRADER_ACCOUNT_ID, 10),
            symbolId: [1], // Subscribe to EURUSD
        });
        logger.info('Subscribed to EURUSD');

    } catch (error) {
        logger.error('An error occurred:', error);
    }
}

main();
