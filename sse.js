/*global EventSource:false */
'use strict';

var EventEmitter = require('eventemitter3')
  , unique = 1;

/**
 * Create a new Server-Sent Events transport.
 *
 * Options:
 *
 * - recconect: boolean, should we reconnect or close the connection by default.
 * - doc: document, reference to a document from where we should create elements.
 * - manual: Don't open the connection when constructing but call .open manually.
 *
 * @constructor
 * @param {String} url The URL we need to connect to.
 * @param {Object} options Optional configuration.
 * @param {Function} fn Optional data callback.
 * @api public
 */
function ServerSentEvents(url, options, fn) {
  if (!(this instanceof ServerSentEvents)) {
    return new ServerSentEvents(url, options, fn);
  }

  if ('function' === typeof options) {
    fn = options; options = null;
  }

  options = options || {};

  this.noreconnect = options.reconnect === false;
  this.doc = options.document || document;
  this.api = this.url = this.div = null;

  //
  // Pre-create the listeners so we can share them between the legacy API and
  // the standard EventSource API. This also makes it easier to remove the event
  // listeners.
  //
  this.listen = {
    data: this.emits('data', function data(evt) { return evt.data; }),
    error: this.emits('error'),
    close: this.emits('close'),
    open: this.emits('open')
  };

  if (!options.manual) {
    this.open(url);
  } else {
    this.url = url;
  }

  if (fn) this.on('data', fn);
}

ServerSentEvents.prototype = new EventEmitter();
ServerSentEvents.prototype.emits = require('emits');
ServerSentEvents.prototype.constructor = ServerSentEvents;

/**
 * Open the connection.
 *
 * @param {String} url URL we want to connect to.
 * @api public
 */
ServerSentEvents.prototype.open = function open(url) {
  if (this.api) this.end();

  url = url || this.url;

  if (ServerSentEvents.legacy) this.legacy(url);
  else this.initialize(url);

  //
  // The assignment of these API's is identical to the legacy and standard API.
  //
  this.api.addEventListener('error', this.listen.error, false);
  this.api.addEventListener('close', this.listen.close, false);
  this.api.addEventListener('open', this.listen.open, false);
};

/**
 * Initialize the standard EventSource API.
 *
 * @param {String} url URL we want to connect to.
 * @api private
 */
ServerSentEvents.prototype.initialize = function initialize(url) {
  this.api = new EventSource(this.url, {
    'withCredentials': true
  });

  this.api.addEventListener('message', this.listen.data, false);
  this.url = url;
};

/**
 * Construct the legacy `addEventStream` API.
 *
 * @param {String} url URL we want to connect to.
 * @api private
 */
ServerSentEvents.prototype.legacy = function legacy(url) {
  //
  // We require unique id's for each.
  //
  var id = '_SSE_LEGACY='+ unique++;

  //
  // We need to transform the given URL and append a _SSE_LEGACY=1 param to it
  // so our server can intercept the usage of these legacy API's.
  //
  url = (~url.indexOf('?') ? '&' : '?') + id;

  //
  // So why the whole innerHTML stuff. There are a couple of reasons:
  //
  // 1. `doc.createElement('event-source')` seems to fail for dynamic injection
  // 2. If you do a createElement and append it the DOM to support older
  //    versions of Opera, you can actually open 2 connections under Opera 9.5
  //
  this.div = this.doc.createElement('div');
  this.doc.body.appendChild(this.div);
  this.div.innerHTML = '<event-source src="'+ url +'" id="'+ id +'">';

  this.url = url;
  this.api = this.doc.getElementById(id);
  this.api.addEventListener('sse', this.listen.data);
};

/**
 * End the active EventSource connection.
 *
 * @api public
 */
ServerSentEvents.prototype.end = function end() {
  if (!this.api) return;

  if (this.api.close) this.api.close();
  else if (this.api.removeEventSource) {
    this.api.removeEventSource(this.url);
    this.api.removeAttribute('src');
  }

  this.api.removeListener('message', this.listen.data);
  this.api.removeListener('error', this.listen.error);
  this.api.removeListener('open', this.listen.open);
  this.api.removeListener('sse', this.listen.data);
};

/**
 * Destroy the created Server-Sent Events API connection.
 *
 * @api private
 */
ServerSentEvents.prototype.destroy = function destroy() {
  this.end();

  //
  // Also nuke the existing references to all the things so it can be garbage
  // collected.
  //
  this.api = this.listen = this.url = null;
};

/**
 * Are we using an legacy API from Opera 8.5+ < 10.70.
 *
 * @type {Boolean}
 * @public
 */
ServerSentEvents.legacy = 'function' === typeof addEventStream;

/**
 * Is there an implementation of EventSource that we can use?
 *
 * @type {Boolean}
 * @public
 */
ServerSentEvents.supported = ServerSentEvents.legacy || 'EventSource' in window;

/**
 * Check if we can establish a cross domain connection using the
 * Server-Sent Event's API. Older versions of the EventSource API did not allow
 * cross domain communication. The Opera version did not support it all. Doing
 * a 'withCredentials' check is the only reliable way of checking CORS support.
 *
 * @type {Boolean}
 * @public
 */
ServerSentEvents.crossdomain = 'EventSource' in window
  && 'withCredentials' in EventSource.prototype;

//
// Expose the module interface.
//
module.exports = ServerSentEvents;
