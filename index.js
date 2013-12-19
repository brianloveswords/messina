const bunyan = require('bunyan');
const _ = require('underscore');
const util = require('util');

module.exports = function(opts) {
  opts = opts || {};

  if (typeof opts === 'string') {
    var name = opts;
    opts = { name: name };
  }

  opts.serializers = opts.serializers || {};
  opts.serializers = _.defaults(opts.serializers, {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res
  });

  return new Messina(opts);
};

function Messina(opts) {
  var self = bunyan.createLogger(opts);

  self.patchConsole = function patchConsole() {
    // Patch console so it only outputs to stderr
    console.log = function() {
      process.stderr.write(util.format.apply(this, arguments) + '\n');
    };

    console.dir = function(object) {
      process.stderr.write(util.inspect(object) + '\n');
    };
  };

  self.catchFatal = function catchFatal() {
    // Ensure uncaught exceptions end up in the event stream too
    process.once('uncaughtException', function (err) {
      self.fatal(err);
      throw err;
    });
  };

  self.init = function init() {
    self.patchConsole();
    self.catchFatal();
  }

  self.middleware = function(options) {
    options = options || {}

    return function (req, res, next) {
      const startTime = new Date();

      if (!options.combinedOutput) {
        self.info({
          req: req
        }, util.format(
          'Incoming Request: %s %s',
          req.method, req.url));
      }

      // this method of hijacking res.end is inspired by connect.logger()
      // see connect/lib/middleware/logger.js for details
      const end = res.end;
      res.end = function(chunk, encoding) {
        const responseTime = new Date() - startTime;
        res.end = end;
        res.end(chunk, encoding);

        if (options.combinedOutput) {
          self.info({
            req: req,
            res: res,
            responseTime: responseTime,
          }, util.format(
            'HTTP %s %s %s %s',
            req.method, req.url, res.statusCode, responseTime));
          return;
        }

        self.info({
          url: req.url,
          responseTime: responseTime,
          res: res,
        }, util.format(
          'Outgoing Response: HTTP %s %s (%s ms)',
          res.statusCode, req.url, responseTime));
      };
      return next();
    };
  };

  return self;
};

