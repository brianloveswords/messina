# messina

Route your app's event stream to a Graylog2 instance and get awesome. Uses the [GELF format](http://www.graylog2.org/about/gelf) for rich logging.

## Approach

There are a few alternative approaches already published for getting bunyan-style logs into GELF format and out to Graylog2, [`bunyan-gelf`](https://github.com/craftti/bunyan-gelf) and [`gelf-stream`](https://github.com/mhart/gelf-stream) for example (`messina` in fact uses parts of `gelf-stream` internally).

The reason I wrote `messina` rather than using one of those is because I did not want to couple my app to a specific log aggregator. By creating a separate utility and using the standard unix pipes, the app doesn't have to care what happens to the log events after they are emitted.

# Install

```bash
$ npm install messina
```

# Setup

```js
var messina = require('messina');
var log = messina('myapp');

log.info('Hooray');
```

* Use `messina` for your app logging. (It's a simple wrapper around [bunyan](https://github.com/trentm/node-bunyan).)
* Configure Graylog2 to accept GELF messages on some port.
* Export some environment variables:

| Name | Default Value
-------|----------------
| **GRAYLOG_HOST** | localhost
| **GRAYLOG_PORT** | 12201
| **GRAYLOG_FACILITY** | *null*

`GRAYLOG_FACILITY` should be set to the name of your app.

## Extras

I'm not trying to tell you how to live your life, but `messina` provides some 
extra functionality that I've found pretty useful:

```js 
var messina = require('messina');
var log = messina('myapp');

log.catchFatal();
```

is equivalent to

```js
process.once('uncaughtException', function (err) {
  log.fatal(err);
  throw err;
});
```

I also like to patch `console` so that it outputs to stderr instead of stdout, but I'm a rebel. It's not strictly necessary as `messina` will toss out any messages it can't parse as JSON or that don't look like bunyan log events.

```js
var messina = require('messina');
var log = messina('myapp');

log.patchConsole();
```

is equivalent to 

```js
const util = require('util');
console.log = function() {
  process.stderr.write(util.format.apply(this, arguments) + '\n');
};
console.dir = function(object) {
  process.stderr.write(util.inspect(object) + '\n');
};
```

Or you can do both at once with `log.init()`.

## Middleware

`messina` comes with express middleware for logging server requests and responses, used like so:

```js
var messina = require('messina');
var log = messina('myapp');

app.use(log.middleware());
```

If you'd like to combine a single request/response cycle into a single log message, simply set `combinedOutput: true`:

```js
var messina = require('messina');
var log = messina('myapp');

app.use(log.middleware({ combinedOutput: true }));
```

# Usage

```bash
$ node app.js | messina
```

`messina` passes everything from `stdin` back to `stdout` so you can continue to pipe it down the line to other utilities, such as `bunyan`'s own log formatter:

```bash
$ node app.js | messina | bunyan
```

# Why messina?

The Graylog2 instance I originally coded this against was branded "Loggins" and had sweet Kenny Loggins picture up in the corner. I figured I'd reunite [the greatest yacht rock duo known to man](http://en.wikipedia.org/wiki/Loggins_and_Messina).

# License

MIT

```
Copyright (c) 2013 Brian J. Brennan

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```