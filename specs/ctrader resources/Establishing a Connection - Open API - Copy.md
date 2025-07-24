# Establishing a Connection - Open API
Clipped from: [https://help.ctrader.com/open-api/connection/](https://help.ctrader.com/open-api/connection/)You can connect to a [**cTrader Open API proxy**](https://help.ctrader.com/open-api/proxies-endpoints/)** using either the TCP protocol or the WebSocket protocol. This guide covers both of these options.**## Using TCP[¶](https://help.ctrader.com/open-api/connection/#using-tcp)SSL UsageThe TCP client connection must use SSL, otherwise you will not be able to connect or interact with the API.You can establish a connection as follows using the official cTrader Open API SDKs.[C#](https://help.ctrader.com/open-api/connection/#__tabbed_1_1)<a href="https://help.ctrader.com/open-api/connection/#__tabbed_1_2">Python</a>
| 1  
2 | _client = new OpenClient("live1.p.ctrader.com", 5035, TimeSpan.FromSeconds(10), useWebSocket: false);  
await _client.Connect() | 
| :--- | :--- |
The OpenClient.Connect() method calls the OpenClient.ConnectTcp() method.
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
14 | private async Task ConnectTcp()  
{  
    _tcpClient = new TcpClient  
    {  
        LingerState = new LingerOption(enable: true, 10)  
    };  
    await _tcpClient.ConnectAsync(Host, Port).ConfigureAwait(continueOnCapturedContext: false);  
    _sslStream = new SslStream(_tcpClient.GetStream(), leaveInnerStreamOpen: false);  
    await _sslStream.AuthenticateAsClientAsync(Host).ConfigureAwait(continueOnCapturedContext: false);  
    Task.Run(delegate  
    {  
        ReadTcp(_cancellationTokenSource.Token);  
    });  
} | 
| :--- | :--- |
The Python Open API client automatically attempts to establish a connection when it is initialized.
| 1 | client = Client("live1.p.ctrader.com", 5035, TcpProtocol) | 
| :--- | :--- |
## Via WebSocket[¶](https://help.ctrader.com/open-api/connection/#via-websocket)When connecting via the WebSocket protocol the [**host and port**](https://help.ctrader.com/open-api/proxies-endpoints/)** are the same as when connecting via the TCP protocol.**Here is how the official cTrader Open API SDKs establish a connection via WebSocket.[C#](https://help.ctrader.com/open-api/connection/#__tabbed_2_1)<a href="https://help.ctrader.com/open-api/connection/#__tabbed_2_2">Python</a>
| 1  
2 | _client = new OpenClient("live1.p.ctrader.com", 5035, TimeSpan.FromSeconds(10), useWebSocket: true);  
await _client.Connect() | 
| :--- | :--- |
The OpenClient.Connect() method calls the OpenClient.ConnectWebSocket() method
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
19 | private async Task ConnectWebScoket()  
{  
    DefaultInterpolatedStringHandler defaultInterpolatedStringHandler = new DefaultInterpolatedStringHandler(7, 2);  
    defaultInterpolatedStringHandler.AppendLiteral("wss://");  
    defaultInterpolatedStringHandler.AppendFormatted(Host);  
    defaultInterpolatedStringHandler.AppendLiteral(":");  
    defaultInterpolatedStringHandler.AppendFormatted(Port);  
    Uri url = new Uri(defaultInterpolatedStringHandler.ToStringAndClear());  
    _websocketClient = new WebsocketClient(url, () =&gt; new ClientWebSocket())  
    {  
        IsTextMessageConversionEnabled = false,  
        ReconnectTimeout = null,  
        IsReconnectionEnabled = false,  
        ErrorReconnectTimeout = null  
    };  
    _webSocketMessageReceivedDisposable = _websocketClient.MessageReceived.Select((ResponseMessage msg) =&gt; ProtoMessage.Parser.ParseFrom(msg.Binary)).Subscribe(new Action\<ProtoMessage&gt;(OnNext));  
    _webSocketDisconnectionHappenedDisposable = _websocketClient.DisconnectionHappened.Subscribe(new Action\<DisconnectionInfo&gt;(OnWebSocketDisconnectionHappened));  
    await _websocketClient.StartOrFail();  
} | 
| :--- | :--- |
The Python SDK does not support the WebSocket standard.For an example of a .NET Blazor web app that uses the WebSocket standard to establish and maintain a connection, [**click here**](https://github.com/spotware/OpenAPI.Net/tree/master/samples/Blazor.WebSocket.Sample)**.**## Best Practices[¶](https://help.ctrader.com/open-api/connection/#best-practices)Here are some guidelines that you should keep in mind when connecting to the cTrader Open API.  
    - At most, you should create two connections - one for demo accounts and one for live accounts. Each connection can support an unlimited number of accounts of a certain type.  
    - After a connection is established, you should pass the [**app authorization flow**](https://help.ctrader.com/open-api/account-authentication/)**. If you send any messages before your application is authorized, you will receive an error.**  
    - To keep a connection alive, keep sending a heartbeat event ([**ProtoHeartbeatEvent**](https://help.ctrader.com/open-api/common-messages/#protoheartbeatevent)**) every 10 seconds.**  
    - Use a message queue for sending/receiving data to avoid concurrent send/receive events.
