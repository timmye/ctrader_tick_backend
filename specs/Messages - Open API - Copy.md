# Messages - Open API
Clipped from: [https://help.ctrader.com/open-api/messages/](https://help.ctrader.com/open-api/messages/)## ProtoOAAccountAuthReq[¶](https://help.ctrader.com/open-api/messages/#protooaaccountauthreq)Request for authorizing of the trading account session.Requires established authorized connection with the client application using ProtoOAApplicationAuthReq.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
| accessToken | string | Required | The Access Token issued for providing access to the Trader's Account. | 
## ProtoOAAccountAuthRes[¶](https://help.ctrader.com/open-api/messages/#protooaaccountauthres)Response to the ProtoOAApplicationAuthRes request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
## ProtoOAAccountDisconnectEvent[¶](https://help.ctrader.com/open-api/messages/#protooaaccountdisconnectevent)Event that is sent when the established session for an account is dropped on the server side.A new session must be authorized for the account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
## ProtoOAAccountLogoutReq[¶](https://help.ctrader.com/open-api/messages/#protooaaccountlogoutreq)Request for logout of trading account session.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
## ProtoOAAccountLogoutRes[¶](https://help.ctrader.com/open-api/messages/#protooaaccountlogoutres)Response to the ProtoOAAccountLogoutReq request.Actual logout of trading account will be completed on ProtoOAAccountDisconnectEvent.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
## ProtoOAAccountsTokenInvalidatedEvent[¶](https://help.ctrader.com/open-api/messages/#protooaaccountstokeninvalidatedevent)Event that is sent when a session to a specific trader's account is terminated by the server but the existing connections with the other trader's accounts are maintained.Reasons to trigger: account was deleted, cTID was deleted, token was refreshed, token was revoked.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountIds | RepeatedField\<int64&gt; | Repeated | The unique identifier of the trader's account in cTrader platform. | 
| reason | string | Optional | The disconnection reason explained. For example: Access Token is expired or recalled. | 
## ProtoOAAmendOrderReq[¶](https://help.ctrader.com/open-api/messages/#protooaamendorderreq)Request for amending the existing pending order.Allowed only if the Access Token has "trade" permissions for the trading account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| orderId | int64 | Required | The unique ID of the order. | 
| volume | int64 | Optional | Volume, represented in 0.01 of a unit (e.g. 1000 in protocol means 10.00 units). | 
| limitPrice | double | Optional | The Limit Price, can be specified for the LIMIT order only. | 
| stopPrice | double | Optional | The Stop Price, can be specified for the STOP and the STOP_LIMIT orders. | 
| expirationTimestamp | int64 | Optional | The Unix timestamp in milliseconds of Order expiration. Should be set for the Good Till Date orders. | 
| stopLoss | double | Optional | The absolute Stop Loss price (e.g. 1.23456). Not supported for MARKET orders. | 
| takeProfit | double | Optional | The absolute Take Profit price (e.g. 1.23456). Not supported for MARKET orders. | 
| slippageInPoints | int32 | Optional | Slippage distance for the MARKET_RANGE and the STOP_LIMIT orders. | 
| relativeStopLoss | int64 | Optional | The relative Stop Loss can be specified instead of the absolute one. Specified in 1/100000 of a unit of price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) For BUY stopLoss = entryPrice - relativeStopLoss, for SELL stopLoss = entryPrice + relativeStopLoss. | 
| relativeTakeProfit | int64 | Optional | The relative Take Profit can be specified instead of the absolute one. Specified in 1/100000 of a unit of price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) For BUY takeProfit = entryPrice + relativeTakeProfit, for SELL takeProfit = entryPrice - relativeTakeProfit. | 
| guaranteedStopLoss | bool | Optional | If TRUE then the Stop Loss is guaranteed. Available for the French Risk or the Guaranteed Stop Loss Accounts. | 
| trailingStopLoss | bool | Optional | If TRUE then the Trailing Stop Loss is applied. | 
| stopTriggerMethod | [ProtoOAOrderTriggerMethod](https://help.ctrader.com/open-api/model-messages/#protooaordertriggermethod) | Optional | Trigger method for the STOP or the STOP_LIMIT pending order. | 
## ProtoOAAmendPositionSLTPReq[¶](https://help.ctrader.com/open-api/messages/#protooaamendpositionsltpreq)Request for amending StopLoss and TakeProfit of existing position.Allowed only if the accessToken has "trade" permissions for the trading account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| positionId | int64 | Required | The unique ID of the position to amend. | 
| stopLoss | double | Optional | Absolute Stop Loss price (1.23456 for example). | 
| takeProfit | double | Optional | Absolute Take Profit price (1.26543 for example). | 
| guaranteedStopLoss | bool | Optional | If TRUE then the Stop Loss is guaranteed. Available for the French Risk or the Guaranteed Stop Loss Accounts. | 
| trailingStopLoss | bool | Optional | If TRUE then the Trailing Stop Loss is applied. | 
| stopLossTriggerMethod | [ProtoOAOrderTriggerMethod](https://help.ctrader.com/open-api/model-messages/#protooaordertriggermethod) | Optional | The Stop trigger method for the Stop Loss/Take Profit order. | 
## ProtoOAApplicationAuthReq[¶](https://help.ctrader.com/open-api/messages/#protooaapplicationauthreq)Request for the authorizing an application to work with the cTrader platform Proxies.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| clientId | string | Required | The unique Client ID provided during the registration. | 
| clientSecret | string | Required | The unique Client Secret provided during the registration. | 
## ProtoOAApplicationAuthRes[¶](https://help.ctrader.com/open-api/messages/#protooaapplicationauthres)Response to the ProtoOAApplicationAuthReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
## ProtoOAAssetClassListReq[¶](https://help.ctrader.com/open-api/messages/#protooaassetclasslistreq)Request for a list of asset classes available for the trader's account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOAAssetClassListRes[¶](https://help.ctrader.com/open-api/messages/#protooaassetclasslistres)Response to the ProtoOAAssetListReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| assetClass | [RepeatedField\<ProtoOAAssetClass&gt;](https://help.ctrader.com/open-api/model-messages/#protooaassetclass) | Repeated | List of the asset classes. | 
## ProtoOAAssetListReq[¶](https://help.ctrader.com/open-api/messages/#protooaassetlistreq)Request for the list of assets available for a trader's account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOAAssetListRes[¶](https://help.ctrader.com/open-api/messages/#protooaassetlistres)Response to the ProtoOAAssetListReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| asset | [RepeatedField\<ProtoOAAsset&gt;](https://help.ctrader.com/open-api/model-messages/#protooaasset) | Repeated | The list of assets. | 
## ProtoOACancelOrderReq[¶](https://help.ctrader.com/open-api/messages/#protooacancelorderreq)Request for cancelling existing pending order.Allowed only if the accessToken has "trade" permissions for the trading account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| orderId | int64 | Required | The unique ID of the order. | 
## ProtoOACashFlowHistoryListReq[¶](https://help.ctrader.com/open-api/messages/#protooacashflowhistorylistreq)Request for getting Trader's historical data of deposits and withdrawals.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| fromTimestamp | int64 | Required | The Unix time from which the search starts &gt;=0 (1st Jan 1970). Validation: toTimestamp - fromTimestamp \<= 604800000 (1 week). | 
| toTimestamp | int64 | Required | The Unix time where to stop searching \<= 2147483646000 (19th Jan 2038). | 
## ProtoOACashFlowHistoryListRes[¶](https://help.ctrader.com/open-api/messages/#protooacashflowhistorylistres)Response to the ProtoOACashFlowHistoryListReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| depositWithdraw | [RepeatedField\<ProtoOADepositWithdraw&gt;](https://help.ctrader.com/open-api/model-messages/#protooadepositwithdraw) | Repeated | The list of deposit and withdrawal operations. | 
## ProtoOAClientDisconnectEvent[¶](https://help.ctrader.com/open-api/messages/#protooaclientdisconnectevent)Event that is sent when the connection with the client application is cancelled by the server.All the sessions for the traders' accounts will be terminated.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| reason | string | Optional | The disconnection reason explained. For example: The application access was blocked by cTrader Administrator. | 
## ProtoOAClosePositionReq[¶](https://help.ctrader.com/open-api/messages/#protooaclosepositionreq)Request for closing or partially closing of an existing position.Allowed only if the accessToken has "trade" permissions for the trading account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| positionId | int64 | Required | The unique ID of the position to close. | 
| volume | int64 | Required | Volume to close, represented in 0.01 of a unit (e.g. 1000 in protocol means 10.00 units). | 
## ProtoOADealListByPositionIdReq[¶](https://help.ctrader.com/open-api/messages/#protooadeallistbypositionidreq)Request for retrieving the deals related to a position.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| positionId | int64 | Required | The unique ID of the position. | 
| fromTimestamp | int64 | Optional | The Unix time in milliseconds of starting the search. Must be bigger or equal to zero (1st Jan 1970). | 
| toTimestamp | int64 | Optional | The Unix time in milliseconds of finishing the search. \<= 2147483646000 (19th Jan 2038). | 
## ProtoOADealListByPositionIdRes[¶](https://help.ctrader.com/open-api/messages/#protooadeallistbypositionidres)Response to the ProtoOADealListByPositionIdReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| deal | [RepeatedField\<ProtoOADeal&gt;](https://help.ctrader.com/open-api/model-messages/#protooadeal) | Repeated | The list of deals. | 
| hasMore | bool | Required | If TRUE then the number of records by filter is larger than chunkSize, the response contains the number of records that is equal to chunkSize. | 
## ProtoOADealListReq[¶](https://help.ctrader.com/open-api/messages/#protooadeallistreq)Request for getting Trader's deals historical data (execution details).Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| fromTimestamp | int64 | Optional | The Unix time from which the search starts &gt;=0 (1st Jan 1970). | 
| toTimestamp | int64 | Optional | The Unix time where to stop searching \<= 2147483646000 (19th Jan 2038). | 
| maxRows | int32 | Optional | The maximum number of the deals to return. | 
## ProtoOADealListRes[¶](https://help.ctrader.com/open-api/messages/#protooadeallistres)The response to the ProtoOADealListRes request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| deal | [RepeatedField\<ProtoOADeal&gt;](https://help.ctrader.com/open-api/model-messages/#protooadeal) | Repeated | The list of the deals. | 
| hasMore | bool | Required | If TRUE then the number of records by filter is larger than chunkSize, the response contains the number of records that is equal to chunkSize. | 
## ProtoOADealOffsetListReq[¶](https://help.ctrader.com/open-api/messages/#protooadealoffsetlistreq)Request for getting sets of Deals that were offset by a specific Deal and that are offsetting the Deal.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| dealId | int64 | Required | The unique ID of the Deal. | 
## ProtoOADealOffsetListRes[¶](https://help.ctrader.com/open-api/messages/#protooadealoffsetlistres)Response for ProtoOADealOffsetListReq.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| offsetBy | [RepeatedField\<ProtoOADealOffset&gt;](https://help.ctrader.com/open-api/model-messages/#protooadealoffset) | Repeated | Deals which closed the specified deal. | 
| offsetting | [RepeatedField\<ProtoOADealOffset&gt;](https://help.ctrader.com/open-api/model-messages/#protooadealoffset) | Repeated | Deals which were closed by the specified deal. | 
## ProtoOADepthEvent[¶](https://help.ctrader.com/open-api/messages/#protooadepthevent)Event that is sent when the structure of depth of market is changed.Requires subscription on the depth of markets for the symbol, see ProtoOASubscribeDepthQuotesReq.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | uint64 | Required | Unique identifier of the Symbol in cTrader platform. | 
| newQuotes | [RepeatedField\<ProtoOADepthQuote&gt;](https://help.ctrader.com/open-api/model-messages/#protooadepthquote) | Repeated | The list of changes in the depth of market quotes. | 
| deletedQuotes | RepeatedField\<uint64&gt; | Repeated | The list of quotes to delete. | 
## ProtoOAErrorRes[¶](https://help.ctrader.com/open-api/messages/#protooaerrorres)Generic response when an ERROR occurred.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Optional | The unique identifier of the trader's account in cTrader platform. | 
| errorCode | string | Required | The name of the ProtoErrorCode or the other custom ErrorCodes (e.g. ProtoCHErrorCode). | 
| description | string | Optional | The error description. | 
| maintenanceEndTimestamp | int64 | Optional | The Unix time in seconds when the current maintenance session will be ended. | 
| retryAfter | uint64 | Optional | When you hit rate limit with errorCode=BLOCKED_PAYLOAD_TYPE, this field will contain amount of seconds until related payload type will be unlocked. | 
## ProtoOAExecutionEvent[¶](https://help.ctrader.com/open-api/messages/#protooaexecutionevent)Event that is sent following the successful order acceptance or execution by the server.Acts as response to the ProtoOANewOrderReq, ProtoOACancelOrderReq, ProtoOAAmendOrderReq, ProtoOAAmendPositionSLTPReq, ProtoOAClosePositionReq requests.Also, the event is sent when a Deposit/Withdrawal took place.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| executionType | [ProtoOAExecutionType](https://help.ctrader.com/open-api/model-messages/#protooaexecutiontype) | Required | Type of the order operation. For example: ACCEPTED, FILLED, etc. | 
| position | [ProtoOAPosition](https://help.ctrader.com/open-api/model-messages/#protooaposition) | Optional | Reference to the position linked with the execution | 
| order | [ProtoOAOrder](https://help.ctrader.com/open-api/model-messages/#protooaorder) | Optional | Reference to the initial order. | 
| deal | [ProtoOADeal](https://help.ctrader.com/open-api/model-messages/#protooadeal) | Optional | Reference to the deal (execution). | 
| bonusDepositWithdraw | [ProtoOABonusDepositWithdraw](https://help.ctrader.com/open-api/model-messages/#protooabonusdepositwithdraw) | Optional | Reference to the Bonus Deposit or Withdrawal operation. | 
| depositWithdraw | [ProtoOADepositWithdraw](https://help.ctrader.com/open-api/model-messages/#protooadepositwithdraw) | Optional | Reference to the Deposit or Withdrawal operation. | 
| errorCode | string | Optional | The name of the ProtoErrorCode or the other custom ErrorCodes (e.g. ProtoCHErrorCode). | 
| isServerEvent | bool | Optional | If TRUE then the event generated by the server logic instead of the trader's request. (e.g. stop-out). | 
## ProtoOAExpectedMarginReq[¶](https://help.ctrader.com/open-api/messages/#protooaexpectedmarginreq)Request for getting the margin estimate according to leverage profiles.Can be used before sending a new order request.This doesn't consider ACCORDING_TO_GSL margin calculation type, as this calculation is trivial: usedMargin = (VWAP price of the position - GSL price) * volume * Quote2Deposit.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | int64 | Required | Unique identifier of the Symbol in cTrader platform. | 
| volume | RepeatedField\<int64&gt; | Repeated | Volume represented in 0.01 of a unit (e.g. 1000 in protocol means 10.00 units). | 
## ProtoOAExpectedMarginRes[¶](https://help.ctrader.com/open-api/messages/#protooaexpectedmarginres)The response to the ProtoOAExpectedMarginReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| margin | [RepeatedField\<ProtoOAExpectedMargin&gt;](https://help.ctrader.com/open-api/model-messages/#protooaexpectedmargin) | Repeated | The buy and sell margin estimate. | 
| moneyDigits | uint32 | Optional | Specifies the exponent of the monetary values. E.g. moneyDigits = 8 must be interpret as business value multiplied by 10^8, then real balance would be 10053099944 / 10^8 = 100.53099944. Affects margin.buyMargin, margin.sellMargin. | 
## ProtoOAGetAccountListByAccessTokenReq[¶](https://help.ctrader.com/open-api/messages/#protooagetaccountlistbyaccesstokenreq)Request for getting the list of granted trader's account for the access token.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| accessToken | string | Required | The Access Token issued for providing access to the Trader's Account. | 
## ProtoOAGetAccountListByAccessTokenRes[¶](https://help.ctrader.com/open-api/messages/#protooagetaccountlistbyaccesstokenres)Response to the ProtoOAGetAccountListByAccessTokenReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| accessToken | string | Required | The Access Token issued for providing access to the Trader's Account. | 
| permissionScope | [ProtoOAClientPermissionScope](https://help.ctrader.com/open-api/model-messages/#protooaclientpermissionscope) | Optional | SCOPE_VIEW, SCOPE_TRADE. | 
| ctidTraderAccount | [RepeatedField\<ProtoOACtidTraderAccount&gt;](https://help.ctrader.com/open-api/model-messages/#protooactidtraderaccount) | Repeated | The list of the accounts. | 
## ProtoOAGetCtidProfileByTokenReq[¶](https://help.ctrader.com/open-api/messages/#protooagetctidprofilebytokenreq)Request for getting details of Trader's profile.Limited due to GDRP requirements.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| accessToken | string | Required | The Access Token issued for providing access to the Trader's Account. | 
## ProtoOAGetCtidProfileByTokenRes[¶](https://help.ctrader.com/open-api/messages/#protooagetctidprofilebytokenres)Response to the ProtoOAGetCtidProfileByTokenReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| profile | [ProtoOACtidProfile](https://help.ctrader.com/open-api/model-messages/#protooactidprofile) | Required | Trader's profile. | 
## ProtoOAGetDynamicLeverageByIDReq[¶](https://help.ctrader.com/open-api/messages/#protooagetdynamicleveragebyidreq)Request for getting a dynamic leverage entity referenced in ProtoOASymbol.leverageId.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| leverageId | int64 | Required |  | 
## ProtoOAGetDynamicLeverageByIDRes[¶](https://help.ctrader.com/open-api/messages/#protooagetdynamicleveragebyidres)Response to the ProtoOAGetDynamicLeverageByIDReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| leverage | [ProtoOADynamicLeverage](https://help.ctrader.com/open-api/model-messages/#protooadynamicleverage) | Required |  | 
## ProtoOAGetPositionUnrealizedPnLReq[¶](https://help.ctrader.com/open-api/messages/#protooagetpositionunrealizedpnlreq)Request for getting trader's positions' unrealized PnLs.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
## ProtoOAGetPositionUnrealizedPnLRes[¶](https://help.ctrader.com/open-api/messages/#protooagetpositionunrealizedpnlres)Response to ProtoOAGetPositionUnrealizedPnLReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
| positionUnrealizedPnL | [RepeatedField\<ProtoOAPositionUnrealizedPnL&gt;](https://help.ctrader.com/open-api/model-messages/#protooapositionunrealizedpnl) | Repeated | Information about trader's positions' unrealized PnLs. | 
| moneyDigits | uint32 | Required | Specifies the exponent of various monetary values. E.g., moneyDigits = 8 should be interpreted as the value multiplied by 10^8 with the 'real' value equal to 10053099944 / 10^8 = 100.53099944. Affects positionUnrealizedPnL.grossUnrealizedPnL, positionUnrealizedPnL.netUnrealizedPnL. | 
## ProtoOAGetTickDataReq[¶](https://help.ctrader.com/open-api/messages/#protooagettickdatareq)Request for getting historical tick data for the symbol.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | int64 | Required | Unique identifier of the Symbol in cTrader platform. | 
| type | [ProtoOAQuoteType](https://help.ctrader.com/open-api/model-messages/#protooaquotetype) | Required | Bid/Ask (½). | 
| fromTimestamp | int64 | Optional | The Unix time in milliseconds of starting the search. Must be bigger or equal to zero (1st Jan 1970). | 
| toTimestamp | int64 | Optional | The Unix time in milliseconds of finishing the search. \<= 2147483646000 (19th Jan 2038). | 
## ProtoOAGetTickDataRes[¶](https://help.ctrader.com/open-api/messages/#protooagettickdatares)Response to the ProtoOAGetTickDataReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| tickData | [RepeatedField\<ProtoOATickData&gt;](https://help.ctrader.com/open-api/model-messages/#protooatickdata) | Repeated | The list of ticks is in chronological order (newest first). The first tick contains Unix time in milliseconds while all subsequent ticks have the time difference in milliseconds between the previous and the current one. | 
| hasMore | bool | Required | If TRUE then the number of records by filter is larger than chunkSize, the response contains the number of records that is equal to chunkSize. | 
## ProtoOAGetTrendbarsReq[¶](https://help.ctrader.com/open-api/messages/#protooagettrendbarsreq)Request for getting historical trend bars for the symbol.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| fromTimestamp | int64 | Optional | The Unix time in milliseconds from which the search starts. Must be bigger or equal to zero (1st Jan 1970). | 
| toTimestamp | int64 | Optional | The Unix time in milliseconds of finishing the search. Smaller or equal to 2147483646000 (19th Jan 2038). | 
| period | [ProtoOATrendbarPeriod](https://help.ctrader.com/open-api/model-messages/#protooatrendbarperiod) | Required | Specifies period of trend bar series (e.g. M1, M10, etc.). | 
| symbolId | int64 | Required | Unique identifier of the Symbol in cTrader platform. | 
| count | uint32 | Optional | Limit number of trend bars in response back from toTimestamp. | 
## ProtoOAGetTrendbarsRes[¶](https://help.ctrader.com/open-api/messages/#protooagettrendbarsres)Response to the ProtoOAGetTrendbarsReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| period | [ProtoOATrendbarPeriod](https://help.ctrader.com/open-api/model-messages/#protooatrendbarperiod) | Required | Specifies period of trend bar series (e.g. M1, M10, etc.). | 
| timestamp | int64 | Optional | Simply don't use this field, as your original request already contains toTimestamp. | 
| trendbar | [RepeatedField\<ProtoOATrendbar&gt;](https://help.ctrader.com/open-api/model-messages/#protooatrendbar) | Repeated | The list of trend bars. | 
| symbolId | int64 | Optional | Unique identifier of the Symbol in cTrader platform. | 
| hasMore | bool | Optional | If TRUE then the number of records by filter is larger than chunkSize, the response contains the number of records that is equal to chunkSize. | 
## ProtoOAMarginCallListReq[¶](https://help.ctrader.com/open-api/messages/#protooamargincalllistreq)Request for a list of existing margin call thresholds configured for a user.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required |  | 
## ProtoOAMarginCallListRes[¶](https://help.ctrader.com/open-api/messages/#protooamargincalllistres)Response with a list of existing user Margin Calls, usually contains 3 items.## ProtoOAMarginCallTriggerEvent[¶](https://help.ctrader.com/open-api/messages/#protooamargincalltriggerevent)Event that is sent when account margin level reaches target marginLevelThreshold.Event is sent no more than once every 10 minutes to avoid spamming.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required |  | 
| marginCall | [ProtoOAMarginCall](https://help.ctrader.com/open-api/model-messages/#protooamargincall) | Required |  | 
## ProtoOAMarginCallUpdateEvent[¶](https://help.ctrader.com/open-api/messages/#protooamargincallupdateevent)Event that is sent when a Margin Call threshold configuration is updated.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required |  | 
| marginCall | [ProtoOAMarginCall](https://help.ctrader.com/open-api/model-messages/#protooamargincall) | Required |  | 
## ProtoOAMarginCallUpdateReq[¶](https://help.ctrader.com/open-api/messages/#protooamargincallupdatereq)Request to modify marginLevelThreshold of specified marginCallType for ctidTraderAccountId.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required |  | 
| marginCall | [ProtoOAMarginCall](https://help.ctrader.com/open-api/model-messages/#protooamargincall) | Required |  | 
## ProtoOAMarginCallUpdateRes[¶](https://help.ctrader.com/open-api/messages/#protooamargincallupdateres)If this response received, it means that margin call was successfully updated.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
## ProtoOAMarginChangedEvent[¶](https://help.ctrader.com/open-api/messages/#protooamarginchangedevent)Event that is sent when the margin allocated to a specific position is changed.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| positionId | uint64 | Required | The unique ID of the position. | 
| usedMargin | uint64 | Required | The new value of the margin used. | 
| moneyDigits | uint32 | Optional | Specifies the exponent of the monetary values. E.g. moneyDigits = 8 must be interpret as business value multiplied by 10^8, then real balance would be 10053099944 / 10^8 = 100.53099944. Affects usedMargin. | 
## ProtoOANewOrderReq[¶](https://help.ctrader.com/open-api/messages/#protooaneworderreq)Request for sending a new trading order.Allowed only if the accessToken has the "trade" permissions for the trading account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | The unique identifier of the trader's account in cTrader platform. | 
| symbolId | int64 | Required | The unique identifier of a symbol in cTrader platform. | 
| orderType | [ProtoOAOrderType](https://help.ctrader.com/open-api/model-messages/#protooaordertype) | Required | The type of an order - MARKET, LIMIT, STOP, MARKET_RANGE, STOP_LIMIT. | 
| tradeSide | [ProtoOATradeSide](https://help.ctrader.com/open-api/model-messages/#protooatradeside) | Required | The trade direction - BUY or SELL. | 
| volume | int64 | Required | The volume represented in 0.01 of a unit (e.g. 1000 in protocol means 10.00 units). | 
| limitPrice | double | Optional | The limit price, can be specified for the LIMIT order only. | 
| stopPrice | double | Optional | Stop Price, can be specified for the STOP and the STOP_LIMIT orders only. | 
| timeInForce | [ProtoOATimeInForce](https://help.ctrader.com/open-api/model-messages/#protooatimeinforce) | Optional | The specific order execution or expiration instruction - GOOD_TILL_DATE, GOOD_TILL_CANCEL, IMMEDIATE_OR_CANCEL, FILL_OR_KILL, MARKET_ON_OPEN. | 
| expirationTimestamp | int64 | Optional | The Unix time in milliseconds of Order expiration. Should be set for the Good Till Date orders. | 
| stopLoss | double | Optional | The absolute Stop Loss price (1.23456 for example). Not supported for MARKET orders. | 
| takeProfit | double | Optional | The absolute Take Profit price (1.23456 for example). Unsupported for MARKET orders. | 
| comment | string | Optional | User-specified comment. MaxLength = 512. | 
| baseSlippagePrice | double | Optional | Base price to calculate relative slippage price for MARKET_RANGE order. | 
| slippageInPoints | int32 | Optional | Slippage distance for MARKET_RANGE and STOP_LIMIT order. | 
| label | string | Optional | User-specified label. MaxLength = 100. | 
| positionId | int64 | Optional | Reference to the existing position if the Order is intended to modify it. | 
| clientOrderId | string | Optional | Optional user-specific clientOrderId (similar to FIX ClOrderID). MaxLength = 50. | 
| relativeStopLoss | int64 | Optional | Relative Stop Loss that can be specified instead of the absolute as one. Specified in 1/100000 of unit of a price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) For BUY stopLoss = entryPrice - relativeStopLoss, for SELL stopLoss = entryPrice + relativeStopLoss. | 
| relativeTakeProfit | int64 | Optional | Relative Take Profit that can be specified instead of the absolute one. Specified in 1/100000 of unit of a price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) For BUY takeProfit = entryPrice + relativeTakeProfit, for SELL takeProfit = entryPrice - relativeTakeProfit. | 
| guaranteedStopLoss | bool | Optional | If TRUE then stopLoss is guaranteed. Required to be set to TRUE for the Limited Risk accounts (ProtoOATrader.isLimitedRisk=true). | 
| trailingStopLoss | bool | Optional | If TRUE then the Stop Loss is Trailing. | 
| stopTriggerMethod | [ProtoOAOrderTriggerMethod](https://help.ctrader.com/open-api/model-messages/#protooaordertriggermethod) | Optional | Trigger method for the STOP or the STOP_LIMIT pending order. | 
## ProtoOAOrderDetailsReq[¶](https://help.ctrader.com/open-api/messages/#protooaorderdetailsreq)Request for getting Order and its related Deals.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| orderId | int64 | Required | The unique ID of the Order. | 
## ProtoOAOrderDetailsRes[¶](https://help.ctrader.com/open-api/messages/#protooaorderdetailsres)Response to the ProtoOAOrderDetailsReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| order | [ProtoOAOrder](https://help.ctrader.com/open-api/model-messages/#protooaorder) | Required | Order details. | 
| deal | [RepeatedField\<ProtoOADeal&gt;](https://help.ctrader.com/open-api/model-messages/#protooadeal) | Repeated | All Deals created by filling the specified Order. | 
## ProtoOAOrderErrorEvent[¶](https://help.ctrader.com/open-api/messages/#protooaordererrorevent)Event that is sent when errors occur during the order requests.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| errorCode | string | Required | The name of the ProtoErrorCode or the other custom ErrorCodes (e.g. ProtoCHErrorCode). | 
| orderId | int64 | Optional | The unique ID of the order. | 
| positionId | int64 | Optional | The unique ID of the position. | 
| description | string | Optional | The error description. | 
## ProtoOAOrderListByPositionIdReq[¶](https://help.ctrader.com/open-api/messages/#protooaorderlistbypositionidreq)Request for retrieving Orders related to a Position by using Position ID.Filtered by utcLastUpdateTimestamp.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| positionId | int64 | Required | The unique ID of the Position. | 
| fromTimestamp | int64 | Optional | The Unix time from which the search starts &gt;=0 (1st Jan 1970). Search by utcLastUpdateTimestamp of the Order. | 
| toTimestamp | int64 | Optional | The Unix time where to stop searching \<= 2147483646000 (19th Jan 2038). Search by utcLastUpdateTimestamp of the Order. | 
## ProtoOAOrderListByPositionIdRes[¶](https://help.ctrader.com/open-api/messages/#protooaorderlistbypositionidres)Response to ProtoOAOrderListByPositionIdReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| order | [RepeatedField\<ProtoOAOrder&gt;](https://help.ctrader.com/open-api/model-messages/#protooaorder) | Repeated | Orders related to the specified Position, sorted by utcLastUpdateTimestamp in descending order (newest first). | 
| hasMore | bool | Required | If TRUE then the number of records by filter is larger than chunkSize, the response contains the number of records that is equal to chunkSize. | 
## ProtoOAOrderListReq[¶](https://help.ctrader.com/open-api/messages/#protooaorderlistreq)Request for getting Trader's orders filtered by timestampField Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| fromTimestamp | int64 | Optional | The Unix time from which the search starts &gt;=0 (1st Jan 1970). | 
| toTimestamp | int64 | Optional | The Unix time where to stop searching \<= 2147483646000 (19th Jan 2038). | 
## ProtoOAOrderListRes[¶](https://help.ctrader.com/open-api/messages/#protooaorderlistres)The response to the ProtoOAOrderListReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| order | [RepeatedField\<ProtoOAOrder&gt;](https://help.ctrader.com/open-api/model-messages/#protooaorder) | Repeated | The list of the orders. | 
| hasMore | bool | Required | If TRUE then the number of records by filter is larger than chunkSize, the response contains the number of records that is equal to chunkSize. | 
## ProtoOAReconcileReq[¶](https://help.ctrader.com/open-api/messages/#protooareconcilereq)Request for getting Trader's current open positions and pending orders data.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| returnProtectionOrders | bool | Optional | If TRUE, then current protection orders are returned separately, otherwise you can use position.stopLoss and position.takeProfit fields. | 
## ProtoOAReconcileRes[¶](https://help.ctrader.com/open-api/messages/#protooareconcileres)The response to the ProtoOAReconcileReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| position | [RepeatedField\<ProtoOAPosition&gt;](https://help.ctrader.com/open-api/model-messages/#protooaposition) | Repeated | The list of trader's account open positions. | 
| order | [RepeatedField\<ProtoOAOrder&gt;](https://help.ctrader.com/open-api/model-messages/#protooaorder) | Repeated | The list of trader's account pending orders. | 
## ProtoOARefreshTokenReq[¶](https://help.ctrader.com/open-api/messages/#protooarefreshtokenreq)Request to refresh the access token using refresh token of granted trader's account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| refreshToken | string | Required | The Refresh Token issued for updating Access Token. | 
## ProtoOARefreshTokenRes[¶](https://help.ctrader.com/open-api/messages/#protooarefreshtokenres)Response to the ProtoOARefreshTokenReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| accessToken | string | Required | The Access Token issued for providing access to the Trader's Account. | 
| tokenType | string | Required | bearer | 
| expiresIn | int64 | Required | Access Token expiration in seconds. | 
| refreshToken | string | Required | Your new Refresh Token. | 
## ProtoOASpotEvent[¶](https://help.ctrader.com/open-api/messages/#protooaspotevent)Event that is sent when a new spot event is generated on the server side.Requires subscription on the spot events, see ProtoOASubscribeSpotsReq.First event, received after subscription will contain latest spot prices even if market is closed.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | int64 | Required | Unique identifier of the Symbol in cTrader platform. | 
| bid | uint64 | Optional | Bid price. Specified in 1/100000 of unit of a price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) | 
| ask | uint64 | Optional | Ask price. Specified in 1/100000 of unit of a price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) | 
| trendbar | [RepeatedField\<ProtoOATrendbar&gt;](https://help.ctrader.com/open-api/model-messages/#protooatrendbar) | Repeated | Returns live trend bar. Requires subscription on the trend bars. | 
| sessionClose | uint64 | Optional | Last session close. Specified in 1/100000 of unit of a price. (e.g. 123000 in protocol means 1.23, 53423782 means 534.23782) | 
| timestamp | int64 | Optional | The Unix time for spot. | 
## ProtoOASubscribeDepthQuotesReq[¶](https://help.ctrader.com/open-api/messages/#protooasubscribedepthquotesreq)Request for subscribing on depth of market of the specified symbol.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | RepeatedField\<int64&gt; | Repeated | Unique identifier of the Symbol in cTrader platform. | 
## ProtoOASubscribeDepthQuotesRes[¶](https://help.ctrader.com/open-api/messages/#protooasubscribedepthquotesres)Response to the ProtoOASubscribeDepthQuotesReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOASubscribeLiveTrendbarReq[¶](https://help.ctrader.com/open-api/messages/#protooasubscribelivetrendbarreq)Request for subscribing for live trend bars.Requires subscription on the spot events, see ProtoOASubscribeSpotsReq.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| period | [ProtoOATrendbarPeriod](https://help.ctrader.com/open-api/model-messages/#protooatrendbarperiod) | Required | Specifies period of trend bar series (e.g. M1, M10, etc.). | 
| symbolId | int64 | Required | Unique identifier of the Symbol in cTrader platform. | 
## ProtoOASubscribeLiveTrendbarRes[¶](https://help.ctrader.com/open-api/messages/#protooasubscribelivetrendbarres)Response to the ProtoOASubscribeLiveTrendbarReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOASubscribeSpotsReq[¶](https://help.ctrader.com/open-api/messages/#protooasubscribespotsreq)Request for subscribing on spot events of the specified symbol.After successful subscription you'll receive technical ProtoOASpotEvent with latest price, after which you'll start receiving updates on prices via consequent ProtoOASpotEvents.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | RepeatedField\<int64&gt; | Repeated | Unique identifier of the Symbol in cTrader platform. | 
| subscribeToSpotTimestamp | bool | Optional | If TRUE you will also receive the timestamp in ProtoOASpotEvent. | 
## ProtoOASubscribeSpotsRes[¶](https://help.ctrader.com/open-api/messages/#protooasubscribespotsres)Response to the ProtoOASubscribeSpotsReq request.Reflects that your request to subscribe for symbol has been added to queue.You'll receive technical ProtoOASpotEvent with current price shortly after this response.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOASymbolByIdReq[¶](https://help.ctrader.com/open-api/messages/#protooasymbolbyidreq)Request for getting a full symbol entity.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | RepeatedField\<int64&gt; | Repeated | Unique identifier of the symbol in cTrader platform. | 
## ProtoOASymbolByIdRes[¶](https://help.ctrader.com/open-api/messages/#protooasymbolbyidres)Response to the ProtoOASymbolByIdReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbol | [RepeatedField\<ProtoOASymbol&gt;](https://help.ctrader.com/open-api/model-messages/#protooasymbol) | Repeated | Symbol entity with the full set of fields. | 
| archivedSymbol | [RepeatedField\<ProtoOAArchivedSymbol&gt;](https://help.ctrader.com/open-api/model-messages/#protooaarchivedsymbol) | Repeated | Archived symbols. | 
## ProtoOASymbolCategoryListReq[¶](https://help.ctrader.com/open-api/messages/#protooasymbolcategorylistreq)Request for a list of symbol categories available for a trading account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOASymbolCategoryListRes[¶](https://help.ctrader.com/open-api/messages/#protooasymbolcategorylistres)Response to the ProtoSymbolCategoryListReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolCategory | [RepeatedField\<ProtoOASymbolCategory&gt;](https://help.ctrader.com/open-api/model-messages/#protooasymbolcategory) | Repeated | The list of symbol categories. | 
## ProtoOASymbolChangedEvent[¶](https://help.ctrader.com/open-api/messages/#protooasymbolchangedevent)Event that is sent when the symbol is changed on the Server side.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | RepeatedField\<int64&gt; | Repeated | Unique identifier of the Symbol in cTrader platform. | 
## ProtoOASymbolsForConversionReq[¶](https://help.ctrader.com/open-api/messages/#protooasymbolsforconversionreq)Request for getting a conversion chain between two assets that consists of several symbols.Use when no direct quote is available.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| firstAssetId | int64 | Required | The ID of the firs asset in the conversation chain. e.g.: for EUR/USD the firstAssetId is EUR ID and lastAssetId is USD ID. | 
| lastAssetId | int64 | Required | The ID of the last asset in the conversation chain. e.g.: for EUR/USD the firstAssetId is EUR ID and lastAssetId is USD ID. | 
## ProtoOASymbolsForConversionRes[¶](https://help.ctrader.com/open-api/messages/#protooasymbolsforconversionres)Response to the ProtoOASymbolsForConversionReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbol | [RepeatedField\<ProtoOALightSymbol&gt;](https://help.ctrader.com/open-api/model-messages/#protooalightsymbol) | Repeated | Conversion chain of the symbols (e.g. EUR/USD, USD/JPY, GBP/JPY -&gt; EUR/GBP). | 
## ProtoOASymbolsListReq[¶](https://help.ctrader.com/open-api/messages/#protooasymbolslistreq)Request for a list of symbols available for a trading account.Symbol entries are returned with the limited set of fields.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| includeArchivedSymbols | bool | Optional | Whether to include old archived symbols into response. | 
## ProtoOASymbolsListRes[¶](https://help.ctrader.com/open-api/messages/#protooasymbolslistres)Response to the ProtoOASymbolsListReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbol | [RepeatedField\<ProtoOALightSymbol&gt;](https://help.ctrader.com/open-api/model-messages/#protooalightsymbol) | Repeated | The list of symbols. | 
| archivedSymbol | [RepeatedField\<ProtoOAArchivedSymbol&gt;](https://help.ctrader.com/open-api/model-messages/#protooaarchivedsymbol) | Repeated | The list of archived symbols. | 
## ProtoOATraderReq[¶](https://help.ctrader.com/open-api/messages/#protooatraderreq)Request for getting data of Trader's Account.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOATraderRes[¶](https://help.ctrader.com/open-api/messages/#protooatraderres)Response to the ProtoOATraderReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| trader | [ProtoOATrader](https://help.ctrader.com/open-api/model-messages/#protooatrader) | Required | The Trader account information. | 
## ProtoOATraderUpdatedEvent[¶](https://help.ctrader.com/open-api/messages/#protooatraderupdatedevent)Event that is sent when a Trader is updated on Server side.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| trader | [ProtoOATrader](https://help.ctrader.com/open-api/model-messages/#protooatrader) | Required | The Trader account information. | 
## ProtoOATrailingSLChangedEvent[¶](https://help.ctrader.com/open-api/messages/#protooatrailingslchangedevent)Event that is sent when the level of the Trailing Stop Loss is changed due to the price level changes.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| positionId | int64 | Required | The unique ID of the position. | 
| orderId | int64 | Required | The unique ID of the order. | 
| stopPrice | double | Required | New value of the Stop Loss price. | 
| utcLastUpdateTimestamp | int64 | Required | The Unix time in milliseconds when the Stop Loss was updated. | 
## ProtoOAUnsubscribeDepthQuotesReq[¶](https://help.ctrader.com/open-api/messages/#protooaunsubscribedepthquotesreq)Request for unsubscribing from the depth of market of the specified symbol.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | RepeatedField\<int64&gt; | Repeated | Unique identifier of the Symbol in cTrader platform. | 
## ProtoOAUnsubscribeDepthQuotesRes[¶](https://help.ctrader.com/open-api/messages/#protooaunsubscribedepthquotesres)Response to the ProtoOAUnsubscribeDepthQuotesReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOAUnsubscribeLiveTrendbarReq[¶](https://help.ctrader.com/open-api/messages/#protooaunsubscribelivetrendbarreq)Request for unsubscribing from the live trend bars.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| period | [ProtoOATrendbarPeriod](https://help.ctrader.com/open-api/model-messages/#protooatrendbarperiod) | Required | Specifies period of trend bar series (e.g. M1, M10, etc.). | 
| symbolId | int64 | Required | Unique identifier of the Symbol in cTrader platform. | 
## ProtoOAUnsubscribeLiveTrendbarRes[¶](https://help.ctrader.com/open-api/messages/#protooaunsubscribelivetrendbarres)Response to the ProtoOASubscribeLiveTrendbarReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOAUnsubscribeSpotsReq[¶](https://help.ctrader.com/open-api/messages/#protooaunsubscribespotsreq)Request for unsubscribing from the spot events of the specified symbol.Request to stop receiving ProtoOASpotEvents related to particular symbols.Unsubscription is useful to minimize traffic, especially during high volatility events.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
| symbolId | RepeatedField\<int64&gt; | Repeated | Unique identifier of the Symbol in cTrader platform. | 
## ProtoOAUnsubscribeSpotsRes[¶](https://help.ctrader.com/open-api/messages/#protooaunsubscribespotsres)Response to the ProtoOASubscribeSpotsRes request.Reflects that your request to unsubscribe will has been added to queue and will be completed shortly.You may still occasionally receive ProtoOASpotEvents until request processing is complete.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| ctidTraderAccountId | int64 | Required | Unique identifier of the trader's account. Used to match responses to trader's accounts. | 
## ProtoOAVersionReq[¶](https://help.ctrader.com/open-api/messages/#protooaversionreq)Request for getting the proxy version.Can be used to check the current version of the Open API scheme.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
## ProtoOAVersionRes[¶](https://help.ctrader.com/open-api/messages/#protooaversionres)Response to the ProtoOAVersionReq request.Field Type Label Description
|  |  |  |  | 
| :--- | :--- | :--- | :--- |
| payloadType | [ProtoOAPayloadType](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype) | Optional |  | 
| version | string | Required | The current version of the server application. | 

