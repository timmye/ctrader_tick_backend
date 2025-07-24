# Sending/Receiving Protobuf Messages - Open API
Clipped from: [https://help.ctrader.com/open-api/sending-receiving-protobuf/](https://help.ctrader.com/open-api/sending-receiving-protobuf/)The process of sending and receiving a message differs between the TCP and WebSocket standards. Below, we explain this process in detail for both types of connections.## Using TCP[¶](https://help.ctrader.com/open-api/sending-receiving-protobuf/#using-tcp)### Sending a Message[¶](https://help.ctrader.com/open-api/sending-receiving-protobuf/#sending-a-message)To send a message via a TCP connection, do the following.  
    1. Change the Protobuf message to an array of bytes (using the Protobuf encoding) by using the official Google Protocol Buffer SDK for your chosen programming language.  
    1. Get the length of the array created during Step 1. Create a new byte array created from this integer. Reverse the new byte array.  
    1. Concatenate the new byte array and the byte array containing the original Protobuf message.  
    1. Send the concatenated array to the connection stream.The examples below demonstrate how these steps are performed in the official Open API SDKs.[C#](https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_1_1)<a href="https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_1_2">Python</a>
| 1  
2  
3  
4  
5  
6  
7 | private async Task WriteTcp(byte\[] messageByte, CancellationToken cancellationToken)  
{  
    byte\[] array = BitConverter.GetBytes(messageByte.Length).Reverse().Concat(messageByte)  
        .ToArray();  
    await _sslStream.WriteAsync(array, 0, array.Length, cancellationToken).ConfigureAwait(continueOnCapturedContext: false);  
    await _sslStream.FlushAsync(cancellationToken).ConfigureAwait(continueOnCapturedContext: false);  
} | 
| :--- | :--- |

| 1  
2  
3 | client = Client(EndPoints.PROTOBUF_LIVE_HOST if hostType.lower() == "live" else EndPoints.PROTOBUF_DEMO_HOST, EndPoints.PROTOBUF_PORT, TcpProtocol)  
request = ProtoOAApplicationAuthReq() # Can be any message  
deferred = client.send(request) | 
| :--- | :--- |
The Python ExampleUsing Twisted, the Python example performs nearly the same operations as the C# one. The client.send(request) can be explained as follows.
| 1  
2  
3 | request = ProtoOAApplicationAuthReq() # Can be any message  
requestAsString = request.SerializeToString() # This method is a part of the Google Protobuf SDK  
requestAsInt32String = struct.pack("!H", len(requestAsString)) # The message is concatenated with the reversed array | 
| :--- | :--- |
For sending the message, the Python SDK uses the Protocol.transport.write() method.### Reading a Message[¶](https://help.ctrader.com/open-api/sending-receiving-protobuf/#reading-a-message)Asynchronous CodeAll Open API SDKs rely on asynchronous execution, meaning that they do not wait for messages to arrive but, instead, react to dynamically arriving messages. As a rresult, receiving a message is typically done via event handlersTo read a message, you will have to perform a sequence of actions that reverses the steps required for sending a message.  
    1. Receive the first four bytes of a byte array (remember, they denote the message length). Reverse these four bytes and change them to an integer.  
    1. Read X amount of bytes from a stream where X is the integer you have gotten during Step 1.  
    1. Use the Google Protobuf SDK to deserialize the message into a valid ProtoMessage.  
    1. Use the payloadType field of the ProtoMessage object to find its actual type. Via the Google Protobuf SDK, change the ProtoMessage to an object of the needed ProtoOA... type.The code snippets below demonstrate how the official Open API SKDs approach reading messages.[C#](https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_2_1)<a href="https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_2_2">Python</a>
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
40  
41  
42  
43  
44  
45  
46  
47  
48  
49  
50  
51  
52  
53  
54  
55  
56  
57  
58  
59  
60  
61  
62  
63  
64  
65  
66  
67  
68  
69  
70 | _tcpClient = new TcpClient  
{  
    LingerState = new LingerOption(enable: true, 10)  
};  
await _tcpClient.ConnectAsync(Host, Port).ConfigureAwait(continueOnCapturedContext: false);  
SslStream _sslStream = new SslStream(_tcpClient.GetStream(), leaveInnerStreamOpen: false);  
await _sslStream.AuthenticateAsClientAsync(Host).ConfigureAwait(continueOnCapturedContext: false);  
  
        private async void ReadTcp(CancellationToken cancellationToken)  
    {  
        byte\[] dataLength = new byte\[4];  
        byte\[] data = null;  
        try  
        {  
            while (!IsDisposed)  
            {  
                int num = 0;  
                do  
                {  
                    int count = dataLength.Length - num;  
                    int num2 = num;  
                    num = num2 + await _sslStream.ReadAsync(dataLength, num, count, cancellationToken).ConfigureAwait(continueOnCapturedContext: false);  
                    if (num == 0)  
                    {  
                        throw new InvalidOperationException("Remote host closed the connection");  
                    }  
                }  
                while (num \< dataLength.Length);  
                int length = GetLength(dataLength);  
                if (length \<= 0)  
                {  
                    continue;  
                }  
  
                data = ArrayPool\<byte&gt;.Shared.Rent(length);  
                num = 0;  
                do  
                {  
                    int count2 = length - num;  
                    int num2 = num;  
                    num = num2 + await _sslStream.ReadAsync(data, num, count2, cancellationToken).ConfigureAwait(continueOnCapturedContext: false);  
                    if (num == 0)  
                    {  
                        throw new InvalidOperationException("Remote host closed the connection");  
                    }  
                }  
                while (num \< length);  
                ProtoMessage protoMessage = ProtoMessage.Parser.ParseFrom(data, 0, length);  
                ArrayPool\<byte&gt;.Shared.Return(data);  
                OnNext(protoMessage);  
            }  
        }  
        catch (Exception innerException)  
        {  
            if (data != null)  
            {  
                ArrayPool\<byte&gt;.Shared.Return(data);  
            }  
  
            ReceiveException exception = new ReceiveException(innerException);  
            OnError(exception);  
        }  
    }  
  
    private int GetLength(byte\[] lengthBytes)  
    {  
        Span\<byte&gt; span = lengthBytes.AsSpan();  
        span.Reverse();  
        return BitConverter.ToInt32(span);  
    } | 
| :--- | :--- |
!!! "The Python Example" In the Python example, all operations with bytes on receiving messages are handled by the dataReceived() method as shown below.```python linenums="1"  
def dataReceived(self, recd):  
    """  
    Convert int prefixed strings into calls to stringReceived.  
    """  
    self.recvd = self.recvd + recd  
    while len(self.recvd) &gt;= self.prefixLength and not self.paused:  
        length ,= struct.unpack(  
            self.structFormat, self.recvd\[:self.prefixLength])  
        if length &gt; self.MAX_LENGTH:  
            self.lengthLimitExceeded(length)  
            return  
        if len(self.recvd) \< length + self.prefixLength:  
            break  
        packet = self.recvd\[self.prefixLength:length + self.prefixLength]  
        self.recvd = self.recvd\[length + self.prefixLength:]  
        self.stringReceived(packet)  
```
| 1  
2  
3  
4  
5  
6  
7  
8 | def stringReceived(self, data):  
    msg = ProtoMessage()  
    msg.ParseFromString(data)  
  
    if msg.payloadType == ProtoHeartbeatEvent().payloadType:  
        self.heartbeat()  
    self.factory.received(msg)  
    return data | 
| :--- | :--- |
## Using WebSocket[¶](https://help.ctrader.com/open-api/sending-receiving-protobuf/#using-websocket)### Sending a Message[¶](https://help.ctrader.com/open-api/sending-receiving-protobuf/#sending-a-message_1)To send a message over a WebSocket connection, perform the following actions.  
    1. Serialize the message into any suitable data format (e.g., a string).  
    1. Add the serialized message to your send queue.The examples below demonstrate how these actions are performed in the official Open API SDKs.[C#](https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_3_1)<a href="https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_3_2">Python</a>The C# SDK uses the WebsocketClient class which is a part of the Websocket.Client package. As shown below, the WebsocketClient.Send() method works as follows.
| 1  
2  
3  
4  
5 | public void Send(byte\[] message)  
{  
    Websocket.Client.Validations.Validations.ValidateInput(message, "message");  
    _messagesBinaryToSendQueue.Writer.TryWrite(new ArraySegment\<byte&gt;(message));  
} | 
| :--- | :--- |
As you can see, the client simply adds an array segment to the send queue.The Python SDK does not support the WebSocket standard.### Receiving a Message[¶](https://help.ctrader.com/open-api/sending-receiving-protobuf/#receiving-a-message)To receive a message over a WebSocket connection, do the following.  
    1. Retrieve the data received from the cTrader backend.  
    1. Deserialize data into a valid Protobuf message.For an illustration of how this is done in the official Open API SDKs, see the below snippets.[C#](https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_4_1)<a href="https://help.ctrader.com/open-api/sending-receiving-protobuf/#__tabbed_4_2">Python</a>To receive messages, a WebsocketClient needs to be subscribed to a callback function that handles what the client does on accepting a new message.
| 1  
2 | var client = new WebsocketCliebnt();  
client.MessageReceived.Subscribe(msg =&gt; {Console.WriteLine(msg);}) | 
| :--- | :--- |
Before subscribing, the .NET SDK parses the message into a Protobuf message. The necessary subscriptions are added in the body of the ConnectWebSocket() callback.
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
In the OnNext() callback, the ProtoMessage is passed to the MessageFactory.GetMessage() callback.
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
26 | private void OnNext(ProtoMessage protoMessage)  
{  
    foreach (KeyValuePair\<int, IObserver\<IMessage&gt;&gt; observer2 in _observers)  
    {  
        observer2.Deconstruct(out var _, out var value);  
        IObserver\<IMessage&gt; observer = value;  
        try  
        {  
            IMessage message = MessageFactory.GetMessage(protoMessage);  
            if (protoMessage.HasClientMsgId \|\| message == null)  
            {  
                observer.OnNext(protoMessage);  
            }  
  
            if (message != null)  
            {  
                observer.OnNext(message);  
            }  
        }  
        catch (Exception innerException)  
        {  
            ObserverException exception = new ObserverException(innerException, observer);  
            OnError(exception);  
        }  
    }  
} | 
| :--- | :--- |
The Python SDK does not support the WebSocket standard.
