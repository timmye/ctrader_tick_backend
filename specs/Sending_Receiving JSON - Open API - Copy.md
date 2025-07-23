# Sending/Receiving JSON - Open API
Clipped from: [https://help.ctrader.com/open-api/sending-receiving-json/](https://help.ctrader.com/open-api/sending-receiving-json/)In this tutorial, we explain how you can send and receive JSON messages.TCP and WebSocketWhen working with JSON, you can use either a TCP connection or a WebSocket connection.## Sending JSON[¶](https://help.ctrader.com/open-api/sending-receiving-json/#sending-json)If you choose to use JSON in your integration, you will have to send strings containing valid JSON to the cTrader backend. The JSON objects passed as these strings have to contain the following keys.Key Value Data Type Definition
|  |  |  | 
| :--- | :--- | :--- |
| "clientMsgId" | string | The unique ID of a message. This ID has to be generated and assigned by on the client side. | 
| "payloadType" | integer | The integer representing the message message. A full list of valid payload types is included in the [**ProtoOAPayloadType**](https://help.ctrader.com/open-api/model-messages/#protooapayloadtype)**.** | 
| "payload" | JSON object | A nested JSON object containing the actual contents of the message. | 
An example of a valid string (representing the [**ProtoOAApplicationAuthReq**](https://help.ctrader.com/open-api/messages/#protooaapplicationauthreq)** message) can be found below.**"{"clientMsgId": "cm_id_2", "payloadType": 2100, "payload": {"clientId": "34Rsd_T098asHkl","clientSecret": "validClientSecret"}}"To send correct JSON strings, you will need to create a custom mechanism for serialisation in your chosen programming language.In the below examples, we define just several approaches to handling serialisation. You can (and should) implement your own depending on your preferred programming language and design pattern(s).[C#](https://help.ctrader.com/open-api/sending-receiving-json/#__tabbed_1_1)<a href="https://help.ctrader.com/open-api/sending-receiving-json/#__tabbed_1_2">Python</a>Below, we define two base classes and then create a custom representation of the [**ProtoOAApplicationAuthReq**](https://help.ctrader.com/open-api/messages/#protooaapplicationauthreq)** message.**
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
33 | public abstract class OpenAPIMessageBase  
{  
    public string ClientMsgId { get; set; }  
    public abstract int PayloadType { get; }  
}  
  
public abstract class OpenAPIMessagePayloadBase { }  
  
public class ApplicationAuthReq : OpenAPIMessageBase  
{  
    public ApplicationAuthReq() { }  
    public ApplicationAuthReq(string clientId, string clientSecret)  
    {  
        this.Payload = new ApplicationAuthReqPayload(clientId, clientSecret);  
        this.ClientMsgId = Guid.NewGuid().ToString();  
    }  
  
    public override int PayloadType =&gt; 2100;  
    public ApplicationAuthReqPayload? Payload { get; set; }  
  
}  
  
public class ApplicationAuthReqPayload : OpenAPIMessagePayloadBase  
{  
    public ApplicationAuthReqPayload() { }  
    public ApplicationAuthReqPayload(string clientId, string clientSecret)  
    {  
        this.ClientId = clientId;  
        this.ClientSecret = clientSecret;  
    }  
    public string ClientId { get; set; } = string.Empty;  
    public string ClientSecret { get; set; } = string.Empty;  
} | 
| :--- | :--- |
We create a base class for all Open API messages and, for demonstration purposes, define the class for [**ProtoOAApplicationAuthReq**](https://help.ctrader.com/open-api/messages/#protooaapplicationauthreq)**.**
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
31 | import uuid  
import json  
  
class OpenAPIMessage:  
  
def payloadType(self):  
    pass  
  
def payload(self):  
    pass  
  
def clientMsgId(self):  
    pass  
  
def asJsonString(self):  
    pass  
  
  
class ApplicationAuthReq(OpenAPIMessage):  
  
def __init__(self, clientId, clientSecret, clientMsgId = str(uuid.uuid4())):  
    self.clientId = clientId  
    self.clientSecret = client_secret  
    self.payloadType = 2100  
    self.clientMsgId = clientMsgId  
    self.payload = {"clientId": self.clientId, "clientSecret": self.clientSecret}  
  
  
  
def asJsonString(self):  
    return json.dumps({"clientMsgId": self.clientMsgId, "payloadType": self.payloadType, "payload": self.payload}) | 
| :--- | :--- |
After implementing the required logic, you should be able to send new messages to the cTrader backend by creating new instances of the classes representing these messages and then passing them to your preferred TCP or WebSocket client.## Receiving JSON[¶](https://help.ctrader.com/open-api/sending-receiving-json/#receiving-json)To receive and process JSON messages, you have to implement a method for deserialising a JSON string into an representation of an Open API message.To implement this method, you may find it helpful to initialise a map (or a dictionary) where payload types can be keys with the names of classes representing messages acting as values. For exception handling purposes, you may want to verify whether the payload type of the message you have received is a key in this map or dictionary. If such a key exists, you can deserialise the message using any suitable logics.After implementing such a method, you may use it as a callback that is triggered every time you receive a new message.[C#](https://help.ctrader.com/open-api/sending-receiving-json/#__tabbed_2_1)<a href="https://help.ctrader.com/open-api/sending-receiving-json/#__tabbed_2_2">Python</a>Note that in the example below TMessage is a generic type. 
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
21 | public static class MessageReceivedCallbacks  
{  
    public static Dictionary\<int, Type&gt; messages = new Dictionary\<int, Type&gt;  
    {  
        {2100, typeof(ApplicationAuthReq) },  
  
    };  
  
    public static TMessage ReadMessage\<TMessage&gt;(string jsonString) where TMessage : OpenAPIMessageBase  
    {  
        JsonDocument doc = JsonDocument.Parse(jsonString);  
        int payloadType = doc.RootElement.GetProperty("payloadType").GetInt32();  
  
        if (!messages.TryGetValue(payloadType, out var type))  
            throw new Exception("This payload type is not supported");  
  
        var result = JsonSerializer.Deserialize(jsonString, type)  as TMessage;  
  
        return result;  
    }  
} | 
| :--- | :--- |
DowncastingThe ReadMessage() method does not actually return a specific message class; you will need to handle downcasting separately when receiving a message.We add the following method to our ApplicationAuthReq class.
| 1  
2  
3 | @staticmethod  
def fromJson(jsonDct):  
    return ApplicationAuthReq(clientId=jsonDct\['payload']\['clientId'], clientSecret=jsonDct\['payload']\['clientSecret'], clientMsgId=jsonDct\['clientMsgId']) | 
| :--- | :--- |
We then add our readMessage callback and retrieve a payload from a dictionary.
| 1  
2  
3  
4  
5  
6  
7  
8  
9 | class MessageReceivedCallbacks:  
  
messagesDict = {2100: ApplicationAuthReq}  
  
@staticmethod  
def readMessage(jsonString):  
    json_dct = json.loads(jsonString)  
    payloadType = jsonDct\['payloadType']  
    return MessageReceivedCallbacks.messagesDict\[payloadType].fromJson(jsonDct) | 
| :--- | :--- |
DowncastingAs Python is duck-typed, there is no need to handle downcasting separately. You can deserialise the JSON string into the required type when receiving it.
