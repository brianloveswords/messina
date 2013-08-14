const test = require('tap').test;
const express = require('express');
const request = require('request');
const sinon = require('sinon');

test('middleware', function (t) {
  const messina = require('../');
  const log = messina('Apples');

  const app = express();
  app.use(log.middleware());

  sinon.spy(process.stdout, 'write');

  t.test('foo', function (t) {
    app.listen(0, function() {
      var server = this;
      request('http://localhost:' + server.address().port, function(err, res) {
        t.ok(process.stdout.write.calledTwice, "two log statements written");

        var reqLog = JSON.parse(process.stdout.write.getCall(0).args[0]);
        t.ok(reqLog.req, 'has req');

        var resLog = JSON.parse(process.stdout.write.getCall(1).args[0]);
        t.ok(resLog.res, 'has res');

        server.close(function(){
          t.end();    
        });
      });
    });
  })
});
