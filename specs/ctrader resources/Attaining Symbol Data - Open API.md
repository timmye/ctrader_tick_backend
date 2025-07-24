# Attaining Symbol Data - Open API
Clipped from: [https://help.ctrader.com/open-api/symbol-data/](https://help.ctrader.com/open-api/symbol-data/)# Attaining Historical Data[¶](https://help.ctrader.com/open-api/symbol-data/#attaining-historical-data)Attaining and interpreting symbol data (e.g., the open and close prices of all bars for a specific period) is essential in any application that has any of the following functionalities.  
    - **Charts**. To construct bar or line charts, you need to know both historical and live bar/quote data.  
    - **Market statistics**. If you want to display market statistics (such as daily price changes for individual symbols), you have to attain both historical and live prices.  
    - **Replays**. In your application, you may allow traders to 'go back in time' and trade on historical data. To do so, you would need to attain and process past bar and/or tick data.In this tutorial, we will show how you can attain and process historical and live bar/tick data as well as live depth quotes.Note that the tutorial only provides a code snippet for attaining historical bar data. As the core logic remains the same regardless of the action you are performing, you can adapt this snippet to attain other types of data.Operating With JSONWhen operating with JSON, you can still reuse code from this tutorial; however, you would need to slightly modify it depending on your approach to serialisation/deserialisation.## Attaining Historical Bar Data[¶](https://help.ctrader.com/open-api/symbol-data/#attaining-historical-bar-data)To receive historical bars data, perform the following actions.  
    - Initialise an object representing [**the ****ProtoOAGetTrendbarsReq**** message**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsreq).   
    - Fill the object properties with the required ctidTraderAccountId, the symbolId, the ProtoOATrendbarPeriod, the count of trendars to return, and the toTimestamp and fromTimestamp Unix timestamps.Timestamp ConstraintsNote that there are some constraints on the maximum possible distance between the toTimestamp and the fromTimestamp. These constaints depend on the specified ProtoOATrendPeriod. To learn more, [**click here**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsreq)**.**  
    - Send the newly created message and receive a response of [**the ****ProtoOAGetTrendbarsRes**** type**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsres). Access its trendbar field to attain a list of trend bars.  
    - Transform the data from the relative format to the actual symbol price. To do so, first, get the low price of a trendbar and divide it by 100000. Then, round the result to symbol digits (e.g., two numbers after the delimiter). To attain the high, open, and close prices of a trendbar, add the trendbar delta of each of these prices to the trendbar low price. Afterward, divide each number by 100000 and round the result to symbol digits.You can complete these actions by reusing the code below.[C#](https://help.ctrader.com/open-api/symbol-data/#__tabbed_1_1)<a href="https://help.ctrader.com/open-api/symbol-data/#__tabbed_1_2">Python</a>
| 1  
 2  
 3  
 4  
 5  
 6  
 7  
 8  
 9  
10  
11  
12  
13  
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  
26  
27  
28  
29  
30  
31  
32  
33  
34  
35  
36  
37  
38  
39  
40 | private static async void TrendbarRequest(ProtoOATrendbarPeriod period, int accountId, int symbolId, int days)  
{  
    Console.WriteLine("Sending ProtoOAGetTrendbarsReq...");  
  
    var request = new ProtoOAGetTrendbarsReq  
    {  
        CtidTraderAccountId = accountId,  
        SymbolId = symbolId,  
        Period = period,  
        FromTimestamp = DateTimeOffset.UtcNow.AddDays(-days).ToUnixTimeMilliseconds(),  
        ToTimestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),  
    };  
  
    Console.WriteLine($"FromTimestamp: {request.FromTimestamp} \| ToTimestamp: {request.ToTimestamp}");  
  
    await _client.SendMessage(request);  
}  
  
public static double GetPriceFromRelative(ProtoOASymbol symbol, long relative) =&gt; Math.Round(relative / 100000.0, symbol.Digits);  
  
private List\<Trendbar&gt; OnHistoricalTrendbarsReceived(ProtoOAGetTrendbarsRes message)   
{  
    var trendbars = message.Trendbar;  
  
    var data = new List\<Trendbar&gt;();  
  
    foreach (var trendbar in trendbars)   
    {  
        data.Add(new Trendbar  
        {  
            Low = GetPriceFromRelative(symbol, trendbar.Low),  
            High = GetPriceFromRelative(symbol, trendbar.Low + (int)trendbar.DeltaHigh),  
            Open = GetPriceFromRelative(symbol, trendbar.Low + (int)trendbar.DeltaOpen),  
            Close = GetPriceFromRelative(symbol, trendbar.Low + (int)trendbar.DeltaClose),  
        }  
        );  
    }  
  
    return data;  
} | 
| :--- | :--- |

| 1  
 2  
 3  
 4  
 5  
 6  
 7  
 8  
 9  
10  
11  
12  
13  
14  
15  
16  
17  
18  
19  
20  
21 | def sendProtoOAGetTrendbarsReq(ctidTraderAccountId, weeks, period, symbolId, clientMsgId = None):  
    request = ProtoOAGetTrendbarsReq()  
    request.ctidTraderAccountId = ctidTraderAccountId  
    request.period = ProtoOATrendbarPeriod.Value(period)  
    request.fromTimestamp = int(calendar.timegm((datetime.datetime.utcnow() - datetime.timedelta(weeks=int(weeks))).utctimetuple())) * 1000  
    request.toTimestamp = int(calendar.timegm(datetime.datetime.utcnow().utctimetuple())) * 1000  
    request.symbolId = int(symbolId)  
    deferred = client.send(request, clientMsgId = clientMsgId)  
  
def getPriceFromRelative(symbol, relative): round(relative / 100000.0, symbol.digits)  
  
def onHistoricalTrendbarsReceived(message):  
  
    trendbars = message.trendbars  
  
    data = \[]  
  
    for trendbar in trenbars:  
        data.append(Trendbar(low=getPriceFromRelative(symbol, trendbar.low), high=getPriceFromRelative(symbol, trendbar.low + int(trendbar.deltaHigh)), open=getPriceFromRelative(symbol, trendbar.low + int(trendbar.deltaHigh)), close=getPriceFromRelative(symbol, trendbar.low +int(trendbar.deltaClose))))  
  
    return data | 
| :--- | :--- |
## Attaining Historical Tick Data[¶](https://help.ctrader.com/open-api/symbol-data/#attaining-historical-tick-data)To receive historical tick data, perform the following actions.  
    - Initialise an object representing [**the ****ProtoOAGetTickDataReq**** message**](https://help.ctrader.com/open-api/messages/#protooagettickdatareq).  
    - Fill the object properties with the required ctidTraderAccountId, the symbolId, the quote type as well as the fromTimestamp and the toTimestamp.Timestamp ConstraintsIt is impossible to request historical tick data for a period larger than one week. As such, the difference between the specified toTimestamp and the fromTimestamp must not be larger than 604800000.  
    - Send the newly created message and receive a response of [**the ****ProtoOAGetTickDataRes**** type**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsres). Access its tickData field to attain a list of elements of the ProtoOATickData type.  
    - Transform the data from the relative format to the actual symbol price. To do so, divide each tick by 100000 and round the result to symbol digits.Requesting a Large Number of TicksThere exists a limit on the number of ticks that can be returned in a ProtoOAGetTickDataRes message. If this limit is exceeded (e.g., there has been a significant number of ticks during the specified period), the ProtoOAGetTickDataRes message will only include the first X ticks, where X is a number lower than the tick limit. The exact limit depends on the configuration of the cTrader backend. To check if there exist more ticks than have been returned in the received message, use the hasMore flag.## Attaining Live Bars Data[¶](https://help.ctrader.com/open-api/symbol-data/#attaining-live-bars-data)To receive live bars, perform the following actions.  
    - Initialise a variable representing [**the ****ProtoOAGetTrendbarsReq**** message**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsreq).   
    - Fill the object properties with the required ctidTraderAccountId, the symbolId, the ProtoOATrendbarPeriod, the count of trendars to return, and the toTimestamp and fromTimestamp Unix timestamps.Timestamp ConstraintsNote that there are some constraints on the maximum possible distance between the toTimestamp and the fromTimestamp. These constaints depend on the specified ProtoOATrendPeriod. To learn more, [**click here**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsreq)**.**  
    - Send the newly created message and receive a response of [**the ****ProtoOAGetTrendbarsRes**** type**](https://help.ctrader.com/open-api/messages/#protooagettrendbarsres). Access its trendbar field to attain a list of trend bars.  
    - Transform the data from the relative format to the actual symbol price. To do so, first get the low price of a trendbar and divide it by 100000. Then, round the result to symbol digits (e.g., two numbers after the delimiter). To attain the high, open, and close prices of a trendbar, add the trendbar delta of each of these prices to the trendbar low price. Afterward, divide each number by 100000 and round the result to symbol digits.  
    - Initialise an object representing [**the ****ProtoOASubscribeLiveTrendbarReq**** message**](https://help.ctrader.com/open-api/messages/#protooasubscribelivetrendbarreq).  
    - Fill the object properties with the required ctidTraderAccountId, the ProtoOATrendbarPeriod, and the symbolId.  
    - Do the same for an object representing [**the ****ProtoOASubscribeSpotsReq**** message**](https://help.ctrader.com/open-api/messages/#protooasubscribespotsreq).  
    - Send the ProtoOASubscribeSpotsReq message and the ProtoOASubscribeLiveTrendbarReq message in that order and receive responses of the [**ProtoOASubscribeSpotsRes**](https://help.ctrader.com/open-api/messages/#protooasubscribespotsres)** and **<a href="https://help.ctrader.com/open-api/messages/#protooasubscribelivetrendbarres">**the ****ProtoOASubscribeLiveTrenbarsRes**** types**</a>. At this point, you are subscribed to live bars data and you should receive messages of <a href="https://help.ctrader.com/open-api/messages/#protooaspotevent">**the ****ProtoOASpotEvent**** type**</a>.Subscribing to Live TrendbarsNote that successfully subscribing to live trendbars first requires a subscription to spot events.  
    - When you receive a new ProtoOASpotEvent message, use its trendbar field to get the data for the last closed bar.  
    - Transform the data from the relative format to the actual symbol prices. To do so, first, get the low price of a trendbar and divide it by 100000. Then, round the result to symbol digits (e.g., two numbers after the delimiter). To attain the high, open, and close prices of a trendbar, add the trendbar delta of each of these prices to the trendbar low price. Afterward, divide each number by 100000 and round the result to symbol digits.To unsubscribe from live trendbar data, you can always send [**the ****ProtoOAUnsubscribeLiveTrendbarsReq**** message**](https://help.ctrader.com/open-api/messages/#protooaunsubscribelivetrendbarreq) containing the symbolId, the period, and your ctidTraderAccountId. In case your request is successful, you should receive a response of <a href="https://help.ctrader.com/open-api/messages/#protooaunsubscribelivetrendbarres">**the ****ProtoOAUnsubscribeLiveTrenbarRes**** type**</a>. Your subscription to spot events will still remain.## Attaining Live Quotes[¶](https://help.ctrader.com/open-api/symbol-data/#attaining-live-quotes)To receive live bid/ask quotes for a symbol, perform the following actions.  
    - Initialise an object representing [**the ****ProtoOASubscribeSpotsReq**** message**](https://help.ctrader.com/open-api/messages/#protooasubscribespotsreq).  
    - Fill the object properties with the ctidTraderAccountId, the symbolId, and, optionally, the subscribeToSpotTimestamp bool.  
    - Send the newly created message and receive a response of the [**ProtoOASubscribeSpotsRes**](https://help.ctrader.com/open-api/messages/#protooasubscribespotsres)** type. At this point, you are subscribed to live quotes data and you should receive messages of **<a href="https://help.ctrader.com/open-api/messages/#protooaspotevent">**the ****ProtoOASpotEvent**** type**</a>.  
    - When you receive a new ProtoOASpotEvent message, access its bid and/or ask fields to attain the latest quotes. Note that you still have to transform the data into an actual price value by dividing it by 100000 and rounding it to the symbol digits.Bid/Ask FieldsNote that as the bid and ask fields are optional, you may not necessarily see ProtoOASpotEvent messages where both are specified.To unsubscribe from quotes data, you can always send [**the ****ProtoOAUnsubscribeSpotsReq**** message**](https://help.ctrader.com/open-api/messages/#protooaunsubscribespotsreq) containing the symbolId and your ctidTraderAccountId. In case your request is successful, you should receive a response of <a href="https://help.ctrader.com/open-api/messages/#protooaunsubscribespotsres">**the ****ProtoOAUnsubscribeSpotsRes**** type**</a>. At this point, you should stop receiving spot events.## Depth Quotes[¶](https://help.ctrader.com/open-api/symbol-data/#depth-quotes)Last but not least, you can also receive live depth or Level II quotes for a symbol. To do so, perform the following actions.You can subscribe and receive live depth or Level II quotes for a symbol from the API.  
    - Initialise an object representing [**the ****ProtoOASubscribeDepthQuotesReq**** message**](https://help.ctrader.com/open-api/messages/#protooasubscribedepthquotesreq).  
    - Fill the object properties with the ctidTraderAccountId and the the symbolId.  
    - Send the newly created message and receive a response of [**the ****ProtoOASubscribeDepthQuotesRes**** type**](https://help.ctrader.com/open-api/messages/#protooasubscribedepthquotesres). At this point, you are subscribed to depth quotes, meaning that you should start receiving <a href="https://help.ctrader.com/open-api/messages/#protooadepthevent">**ProtoOADepthEvent**** messages**</a>.  
    - When you receive a new ProtoOADepthEvent message, you will need to use its newQuotes and deletedQuotes fields to get the latest depth data. You will also need to transform the data into an actual price value by dividing it by 100000 and rounding the result to the symbol digits. You will also need to transform the depth quote size into units by dividing it by 100.To unsubscribe from depth events, you can always use [**the ****ProtoOAUnsubscribeDepthQuotesReq**** message**](https://help.ctrader.com/open-api/messages/#protooaunsubscribedepthquotesreq) while specifying the symbolId and the ctidTraderAccountId. You should receive a message of <a href="https://help.ctrader.com/open-api/messages/#protooaunsubscribedepthquotesres">**the ****ProtoOAUnsubscribeDepthQuotesRes**** type**</a>; afterward, you should stop receiving depth events.
