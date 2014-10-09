'use strict';

var parse = require('url').parse;

/**
 * Attempt to detect if we're dealing with a legacy implementation of Opera
 * which requires the use of a slightly different message encoding
 *
 * @param {Object} query Query string of the incoming connection.
 * @param {Object} headers Header of the incoming connection.
 * @returns {Boolean}
 * @api private
 */
function legacy(query, headers) {
  return '_SSE_LEGACY' in query
    || headers['user-agent'] && (/^Opera[^\/]*\/9/).test(headers['user-agent']);
}

/**
 * A Server-Sent-Events.
 *
 * @TODO support GZIP
 * @constructor
 * @param {Request} req Incoming HTTP request.
 * @param {Response} res Outgoing HTTP response.
 * @param {Object} options Addition configuration.
 * @api public
 */
function SSE(req, res, options) {
  if (!(this instanceof SSE)) return new SSE(req, res, options);
  options = options || {};

  this.id = 0;
  this.res = res;
  this.lastEventId = 0;
  this.url = parse(req.url, true);
  this.numbering = options.numbering === true;
  this.legacy = legacy(this.url.query, res.headers);

  if (!options.manual) {
    this.accept(req);
  }
}

/**
 * Accept the incoming HTTP request and see if we need to send any lost messages
 * back to the connected client.
 *
 * @TODO lookup the Last-Event-ID header for potential missing requests.
 * @param {Request} req Incoming HTTP request.
 * @api private
 */
SSE.prototype.accept = function accept(req) {
  this.res.statusCode = 200;

  this.res.setHeader('Transfer-Encoding', 'chunked');
  this.res.setHeader('Cache-Control', 'no-cache');
  this.res.setHeader('Connection', 'keep-alive');
  this.res.setHeader('Content-Type', this.legacy
    ? 'text/x-dom-event-stream'
    : 'text/event-stream'
  );

  if (!req.headers['last-event-id']) return;

  this.lastEventId = +req.headers['last-event-id'];
};

/**
 * Set the retry interval for the EventSource API.
 *
 * @param {String|Number} interval Reconnection interval in milliseconds.
 * @returns {Boolean} Successful write operation.
 * @api public
 */
SSE.prototype.retry = function retry(interval) {
  return this._write(this.format('retry', interval));
};

/**
 * Format an outgoing message according to the given protocol This allows us to
 * optimize the outgoing messages as well as the legacy API requires a space
 * after the key while the normal API accepts both.
 *
 * @param {String} key Protocol key we need to sent.
 * @param {String} value Value of the protocol key.
 * @returns {String} Formatted string according to the protocol.
 * @api private
 */
SSE.prototype.format = function format(key, value) {
  return key +':'+ (this.legacy ? ' ' : '') + value +'\n';
};

/**
 * Write a message to the connected client.
 *
 * @param {String|Array} msg Message(s)? to sent.
 * @returns {Boolean} Successful write.
 * @api public
 */
SSE.prototype.write = function write(msg) {
  if (!Array.isArray(msg)) msg = [msg];

  for (var payload = '', i = 0, l = msg.length; i < l; i++) {
    payload += this.format('data', msg[i]);
  }

  if (this.legacy) {
    payload = this.format('Event', 'sse');
  } else if (this.numbering) {
    if (this.storage) this.storage.set(this.id, payload);

    payload = this.format('id', this.id) + payload;
    this.id++;
  }

  return this._write(payload);
};

/**
 * Flush a message to the actual outgoing HTTP response.
 *
 * @returns {Boolean} Indication of a successful write
 * @api private
 */
SSE.prototype._write = function write(packet) {
  if (!this.res) return false;

  return this.res.write(packet +'\n');
};

//
// Expose the interface.
//
module.exports = SSE;
