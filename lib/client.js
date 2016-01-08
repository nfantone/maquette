'use strict';
var q = require('q');
var mqtt = require('mqtt');
var mapper = require('./serdes.js');
var _ = {
  defaults: require('lodash.defaults'),
  isFunction: require('lodash.isfunction'),
  isArray: require('lodash.isarray'),
  isString: require('lodash.isstring')
};

var Client = (function() {
  function MqttClient() {
    this.address = undefined;

    if (arguments.length > 1) {
      this.address = arguments[0];
      this.options = arguments[1];
    } else {
      this.options = arguments[0];
    }

    this.options = _.defaults({}, this.options, MqttClient.DEFAULTS.connect);
    this.controllers = [];
  }

  MqttClient.prototype.connect = function(options) {
    options = _.defaults({}, options, this.options);
    var defer = q.defer();
    this.client = mqtt.connect(this.address, options);
    this.client.on('connect', defer.resolve);
    return defer.promise;
  };

  MqttClient.prototype._registerCallbackFor = function(event) {
    var that = this;
    var fname = 'on' + event[0].toUpperCase() + event.slice(1);
    this.client.on(event, function() {
      var i = 0;
      for (; i < that.controllers.length; i++) {
        if (that.controllers[i][fname]) {
          that.controllers[i][fname].apply(null, arguments);
        }
      }
    });
  };

  MqttClient.prototype._registerEvents = function() {
    var that = this;
    var j = 0;

    this.client.handleMessage = function(packet, done) {
      var i = 0;
      var payload = mapper.deserialize(packet.payload);
      try {
        for (; i < that.controllers.length; i++) {
          that.controllers[i].onMessage(packet.topic, payload);
        }
      } catch (e) {
        return done(e);
      }
      return done();
    };

    for (; j < MqttClient.EVENTS.length; j++) {
      this._registerCallbackFor(MqttClient.EVENTS[j]);
    }
  };

  MqttClient.prototype._ensureConnect = function(cb) {
    if (!this.client) {
      if (this.options.autoconnect) {
        this.connect();
        this._registerEvents();
      } else {
        return cb(new Error('No connection to MQTT broker: call Client#connect() before publishing/subscribing or set `options.autoconnect` to true'));
      }
    }
    return cb();
  };

  MqttClient.prototype.publish = function() {
    var topic = this.options.topic;
    var message;
    var options;

    if (arguments.length > 1) {
      topic = arguments[0];
      message = arguments[1];
      options = arguments[2];
    } else {
      message = arguments[0];
      options = arguments[1];
    }

    var deferred = q.defer();
    var that = this;

    this._ensureConnect(function(err) {

      if (err) {
        return deferred.reject(err);
      }

      // Serialize incoming message as a application/json string
      message = mapper.serialize(message);

      // Extend options with default values
      options = _.defaults({}, options, MqttClient.DEFAULTS.client);
      that.client.publish(topic, message, options, deferred.resolve);
    });

    return deferred.promise;
  };

  MqttClient.prototype.register = function(controller) {
    var i = 0;
    controller = _.isArray(controller) ? controller : [controller];

    for (; i < controller.length; i++) {
      if (controller[i] && _.isFunction(controller[i].onMessage)) {
        this.controllers.push(controller[i]);
      }
    }
    return this;
  };

  MqttClient.prototype.subscribe = function() {
    var args = Array.prototype.slice(arguments);
    var topic = this.options.topic;
    var options;
    if (args.length > 1) {
      topic = args[0];
      options = args[1];
    } else {
      options = args[0];
    }
    var deferred = q.defer();
    var that = this;

    this._ensureConnect(function(err) {
      if (err) {
        return deferred.reject(err);
      }

      // Extend options with default values
      options = _.defaults({}, options, MqttClient.DEFAULTS.client);
      that.client.subscribe(topic, options, deferred.resolve);
    });
    return deferred.promise;
  };

  MqttClient.prototype.end = function() {
    var defer = q.defer();
    this.client.end(defer.resolve);
    return defer.promise;
  };

  MqttClient.EVENTS = ['error', 'close', 'connect', 'reconnect', 'offline'];

  MqttClient.DEFAULTS = {
    connect: {
      connectTimeout: 15 * 10000,
      autoconnect: true,
      clean: false
    },
    client: {
      qos: 1
    }
  };

  return MqttClient;
})();

module.exports = Client;
