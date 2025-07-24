# Error Handling - Open API
Clipped from: [https://help.ctrader.com/open-api/error-handling/](https://help.ctrader.com/open-api/error-handling/)Error handling is a crucial part of any reliable and user-friendly Open API application. Unless you catch and process various errors, your users may experience 'janky' UI or may be prevented from performing certain essential actions entirely.Broadly speaking, different error handling processes may be implemented depending on the layer where an error occurs.  
    - At the data/domain layer. In some cases, the cTrader backend may send [**the ****ProtoErrorRes**** message**](https://help.ctrader.com/open-api/common-messages/#protoerrorres) as a response to one of your requests. For operations related to orders, deals, or positions, you may also receive <a href="https://help.ctrader.com/open-api/messages/#protooaordererrorevent">**the ****ProtoOAOrderErrorEvent**** message**</a>.  
    - At the domain/application layer. Users may perform actions that you have not accounted for in your code, resulting in your application behaving unexpectedly.The mechanisms for handling errors at these levels are different and are described below.## Error Handling at the Data/Domain Layer[¶](https://help.ctrader.com/open-api/error-handling/#error-handling-at-the-datadomain-layer)You may receive ProtoErrorRes or ProtoOAOrderErrorEvent in the following situations (note that the list is not exhaustive).  
    - Attempting to place an order for a symbol for which the market is closed.  
    - Sending an incorrect or an unsupported message.  
    - Attempting to modify an order that is being executed.  
    - Sending a message after losing your connection to the cTrader backend.Analysing ErrorsBoth the ProtoErrorRes and the ProtoOAOrderErrorEvent have the errorCode and description fields that contain precise information about the type of error that has occurred and its description. You can see the full list of all supported error codes in [**the ****ProtoErrorCode**** enum**](https://help.ctrader.com/open-api/common-model-messages/#protoerrorcode).To make sure that your application does not 'break' in such cases, you can usually subscribe to callbacks that trigger when you receive an error response. The exact logic of these callbacks as well as how you can subscribe to them depend on the client you are using to establish a connection and listen to the messages stream.Working With JSONWhen operating with JSON, you can still reuse code from this tutorial; however, you would need to slightly modify it depending on your approach to serialisation/deserialisation and your preferred TCP/WebSocket client.[C#](https://help.ctrader.com/open-api/error-handling/#__tabbed_1_1)<a href="https://help.ctrader.com/open-api/error-handling/#__tabbed_1_2">Python</a>
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
19 | private void SubscribeToErrors(IObservable\<IMessage&gt; observable)  
{  
    if (observable is null) throw new ArgumentNullException(nameof(observable));  
  
    observable.ObserveOn(SynchronizationContext.Current).Subscribe(_ =&gt; { }, OnError);  
    observable.OfType\<ProtoErrorRes&gt;().ObserveOn(SynchronizationContext.Current).Subscribe(OnErrorRes);  
  
    observable.OfType\<ProtoOAOrderErrorEvent&gt;().ObserveOn(SynchronizationContext.Current).Subscribe(OnOrderErrorRes);  
}  
  
private void OnOrderErrorRes(ProtoOAErrorRes error)  
{  
    Console.WriteLine($"Error: Error {error.ErrorCode}; {error.Description}");  
}  
  
private void OnErrorRes(ProtoErrorRes error)  
{  
    Console.WriteLine($"Error: Error {error.ErrorCode}; {error.Description}");  
} | 
| :--- | :--- |
When using the twisted library to handle asynchronous operations, you have to subscribe to an error callback every time you send a new message as shown in the below example for ProtoOAVersionReq.
| 1  
2  
3  
4  
5  
6  
7  
8 | def sendProtoOAVersionReq(clientMsgId = None):  
    request = ProtoOAVersionReq()  
    deferred = client.send(request, clientMsgId = clientMsgId)  
    deferred.addErrback(onError)  
  
def onError(failure):  
    print("Message Error: ", failure)  
    reactor.callLater(3, callable=executeUserCommand) | 
| :--- | :--- |
## Error Handling at the Domain/Application Layer[¶](https://help.ctrader.com/open-api/error-handling/#error-handling-at-the-domainapplication-layer)The way you handle errors at the domain and application layers depends on your chosen programming language, UI framework, and the use cases you implement, making it difficult to provide specific code snippets and solutions.However, the following recommendations can prove useful regardless of how you choose to integrated with the cTrader Open API.  
    - Always implemented a dedicated error state for major UI elements. This would prevent your application from 'breaking' entirely and allow for running in a semi-degradated state.  
    - Implement a secure and reliable logging mechanism that would record errors in a suitable location (e.g., local storage). If repeated errors occur, logging should simplify identifying and addressing their cause.  
    - Create a mechanism for users to inform you of errors. This can be as simple as providing your contact info within the application or as complicated as adding an automatic feedback submission service that triggers on new errors.  
    - Ensure that any resources used when errors occur are properly cleaned up. While most languages offer 'garbage collector' services, you may want to specify custom resource disposal logics.
