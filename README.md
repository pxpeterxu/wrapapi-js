# WrapAPI Javascript client library/SDK

This library makes using the APIs at [WrapAPI](https://wrapapi.com) easier by automatically managing sessions and checking inputs, as an alternaive to manually crafting HTTP requests. It is built on top of [axios](https://github.com/mzabriskie/axios), and can be used both on the server- and client-side.

## Installation

* **Using NPM**: `npm install wrapapi`
* **With a file**: use the prepackaged versions in the `dist` folder, or just downloading them at  
    * Uncompressed: https://raw.githubusercontent.com/pxpeterxu/wrapapi/master/dist/wrapapi.js
    * Minified: https://raw.githubusercontent.com/pxpeterxu/wrapapi/master/dist/wrapapi-min.js

## Basic usage
To initialize the client, create an instance with your [API key](https://wrapapi.com/#/user).
```
var wrapapi = require('wrapapi');
var client = new wrapapi.Client('Your API key goes here');
```
Once initialized, it's easy to send simple requests.
```
client.call('phsource', 'hackernews', 'login', '1.0.0', {
  acct: 'username',
  pw: 'password'
}).then(function(response) {
  console.log(response);
  // Will output { success: true, outputScenario: ..., data: ..., stateToken }
  
  return client.call('phsource', 'hackernews', 'index', 'latest', null, response.stateToken);
}).catch(function(e) { ... }).
```
You can also create a session so that state tokens returned by WrapAPI are automatically used for subsequent requests:
```
var session = client.Session();
session.call('phsource', 'hackernews', 'login', '1.0.0', {
  acct: 'username',
  pw: 'password'
}).then(function(response) {
  console.log(response);
  return session.call('phsource', 'hackernews', 'index', 'latest');
  // The stateToken from the login call above is automatically saved and used
  // for this subsequent request, so this code does the same as the previous
  // example
}).catch(function(e) { ... }).
```

## API
* `var client = new wrapapi.Client(apiKey)`: instantiates a new client
* `client`:
  * `client.call(username, repository, name, version[, data, stateToken])`: calls a WrapAPI API element. Returns a Promise that will be passed the response data from WrapAPI.
    * **Errors**: If the result from WrapAPI indicates an error, a `wrapapi.Error` will be thrown with the error details in an array of `messages` and the machine-readable error types in `errTypes`. This will happen if, for example, the API element doesn't exist, the API key is invalid, or no output scenarios matched the API element's output.
  *  `client.Session()`: creates a session object that will keep track of stateTokens and automatically use them in subsequent requests. Sessions have the same APIs as `client`, so `client.Session().call` has the same arguments as above
