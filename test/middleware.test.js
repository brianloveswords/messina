const test = require('tap').test;
const express = require('express');
const request = require('request');
const sinon = require('sinon');

test('middleware', function (t) {
  const messina = require('../');
  const log = messina('Apples');

  const app = express();
  var opts = { combinedOutput: false };
  app.use(log.middleware(opts));

  t.test('logs requests and responses', function (t) {
    sinon.spy(process.stdout, 'write');

    app.listen(0, function() {
      var server = this;
      request('http://localhost:' + server.address().port, function(err, res) {
        t.ok(process.stdout.write.calledTwice, "two log statements written");

        var reqLog = JSON.parse(process.stdout.write.getCall(0).args[0]);
        t.ok(reqLog.req, 'has req');

        var resLog = JSON.parse(process.stdout.write.getCall(1).args[0]);
        t.ok(resLog.res, 'has res');

        server.close(function(){
          process.stdout.write.restore();
          t.end();
        });
      });
    });
  });

  t.test('logs requests and responses with a single output', function (t) {
    sinon.spy(process.stdout, 'write');
    opts.combinedOutput = true;

    app.listen(0, function() {
      var server = this;
      request('http://localhost:' + server.address().port, function(err, res) {
        t.ok(process.stdout.write.calledOnce, "one log statement written");

        var combinedLog = JSON.parse(process.stdout.write.getCall(0).args[0]);
        t.ok(combinedLog.req, 'has req');
        t.ok(combinedLog.res, 'has res');
        t.ok(combinedLog.responseTime !== undefined, 'has responseTime');

        server.close(function(){
          process.stdout.write.restore();
          t.end();
        });
      });
    });
  });
});
