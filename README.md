# serversentevent

[![Made by unshift](https://img.shields.io/badge/made%20by-unshift-00ffcc.svg?style=flat-square)](http://unshift.io)[![Version npm](http://img.shields.io/npm/v/serversentevent.svg?style=flat-square)](http://browsenpm.org/package/serversentevent)[![Build Status](http://img.shields.io/travis/unshiftio/serversentevent/master.svg?style=flat-square)](https://travis-ci.org/unshiftio/serversentevent)[![Dependencies](https://img.shields.io/david/unshiftio/serversentevent.svg?style=flat-square)](https://david-dm.org/unshiftio/serversentevent)[![Coverage Status](http://img.shields.io/coveralls/unshiftio/serversentevent/master.svg?style=flat-square)](https://coveralls.io/r/unshiftio/serversentevent?branch=master)[![IRC channel](http://img.shields.io/badge/IRC-irc.freenode.net%23unshift-00a8ff.svg?style=flat-square)](http://webchat.freenode.net/?channels=unshift)

**YES, YET ANOTHER SERVER-SENT EVENT MODULE, HERE'S WHY**: Server-Sent Events is
one of the most under estimated real-time technologies and as a result of this
there are a lot of low quality modules in the node and browse ecosystem which
fixes minor issues. `serversent-event` there are a couple ridiculous high`
standards what this module has to follow:

1. Support `EventSource` and `addEventStream` (which is supported in Opera 8.5+)
2. The ability to prevent the build-in reconnect support as reconnecting on
   interval is absurdly stupid and harmfull.
3. Proper support for the build-in message ordering using dedicated message
   storage systems.
4. As `text/event-stream` is a text based protocol it supports GZIP. We should
   enable it by default to reduce data transfer.
5. It should ignore the `event:` API. It's too verbose as doing a 
  `[event-name, data]` JSON packet saves much more bandwidth. In addition to
  that, by ignoring the event API we correctly implement the `addEventStream`
  API.

And above all, it should be a all in one solution. A browser client which is
node compatible and a server which runs in perfect harmony with the client.

## Installation

Everything is node and the client is browserify compatible so you can everything
in one go using npm:

```
npm install --save serversent-event
```
