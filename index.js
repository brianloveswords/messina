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

  self.init = function init() {
    // Patch console so it only outputs to stderr
    console.log = function() {
      process.stderr.write(util.format.apply(this, arguments) + '\n');
    };

    console.dir = function(object) {
      process.stderr.write(util.inspect(object) + '\n');
    };

    // Ensure uncaught exceptions end up in the event stream too
    process.once('uncaughtException', function (err) {
      self.fatal(err);
      throw err;
    });
  };

  self.middleware = function() {
    return function (req, res, next) {
      const startTime = new Date();
      self.info({
        req: req
      }, util.format(
        'Incoming Request: %s %s',
        req.method, req.url));

      // this method of hijacking res.end is inspired by connect.logger()
      // see connect/lib/middleware/logger.js for details
      const end = res.end;
      res.end = function(chunk, encoding) {
        const responseTime = new Date() - startTime;
        res.end = end;
        res.end(chunk, encoding);
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

