# ![maquette](https://www.dropbox.com/s/yq92g1oam4l5o0o/maquette-logo.png?raw=1)

[![Greenkeeper badge](https://badges.greenkeeper.io/nfantone/maquette.svg)](https://greenkeeper.io/)

A thin wrapper around [mqtt.js](https://github.com/mqttjs/MQTT.js) that provides a cleaner, simpler API with promises support.

## Installation

```sh
npm install --save maquette
```

## Example usage

```javascript
var maq = require('maquette');

var client = new maq.Client('mqtt://test.mosquitto.org',
  { clientId: 'my_client_id', topic: 'maquette/test' });

client.register({
    onMessage: function(topic, message) {
      console.log('Got ', message, ' from ', topic);
    }
});

client.subscribe()
  .then(function () {
    client.publish({ message: 'Hello world!' });
  });

process.once('SIGINT', function() {
  client.end().then(function() {
    console.log('Client ended connection to broker');
  });
});
```
## API

```javascript
// TODO
```

## Features

**maquette** provides some additional features over using plain mqtts.js:

+ _Delayed connection_. Connection will be established on first published message or subscription.
+ _Promises_. No callbacks. Main API methods have been promisified using [q](www.npmjs.org/packages/q) .
+ _Sensible defaults_. Based on common usages, it reduces configuration and simplifies code.
+ _Controller delegation_. Let an external controller handle incoming messages and events.

## License

MIT
