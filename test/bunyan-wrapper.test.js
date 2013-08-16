const test = require('tap').test;
const exec = require('child_process').exec;
const path = require('path');
const sinon = require('sinon');
const bunyan = require('bunyan');


test('createLogger', function (t) {
  const messina = require('../');

  sinon.spy(bunyan, 'createLogger');

  test('wraps bunyan', function(t) {
    var log = messina({ name: 'Apples' });
    t.ok(bunyan.createLogger.called, "underlying bunyan method called");
    bunyan.createLogger.reset();
    t.end();
  });

  t.test('string argument becomes name', function (t) {
    var log = messina('Apples');
    t.ok(bunyan.createLogger.calledWithMatch({ name: 'Apples' }), "string used as name");
    bunyan.createLogger.reset();
    t.end();
  });

  t.test('obj argument', function (t) {
    t.test('with name', function (t) {
      var log = messina({name: 'Apples' });
      t.ok(bunyan.createLogger.calledWithMatch({ name: 'Apples' }), "options object used");
      t.equal(log.serializers.req, bunyan.stdSerializers.req, "has default req serializer");
      t.equal(log.serializers.res, bunyan.stdSerializers.res, "has default res serializer");
      bunyan.createLogger.reset();
      t.end();
    });

    t.test('with serializers', function (t) {
      var serializer = function(val) { return 'my serializer'; };
      var log = messina({
        name: 'Apples',
        serializers: {
          foo: serializer,
          req: serializer
        }
      });
      t.equal(log.serializers.req, serializer, "has my req serializer");
      t.equal(log.serializers.res, bunyan.stdSerializers.res, "has default res serializer");
      t.equal(log.serializers.foo, serializer, "has foo serializer");
      t.end();
    });
  });
});

test ('patchConsole', function (t) {
  const messina = require('../');
  const log = messina('Apples');
  log.patchConsole();

  sinon.spy(process.stderr, 'write');

  t.test('patches console.log to stderr', function (t) {
    console.log('hi');
    t.ok(process.stderr.write.calledOnce, 'log written to stderr');
    process.stderr.write.reset();
    t.end();
  });

  t.test('patches console.dir to stderr', function (t) {
    console.dir({ some: 'thing' });
    t.ok(process.stderr.write.calledOnce, 'log written to stderr');
    process.stderr.write.reset();
    t.end();
  });
});

test('catchFatal', function (t) {
  t.test('on uncaughtException', function (t) {
    exec('node ' + path.join(__dirname, 'uncaught.js'), {
      cwd: __dirname
    }, function (error, stdout, stderr) {
      t.ok(stdout, 'should have stdout');
      t.doesNotThrow(function(){ JSON.parse(stdout.trim()); }, 'should have JSON on stdout');
      t.ok(stderr, 'should have stderr');
      t.end();
    });
  });
});

test('init patches console and catches fatal', function(t) {
  const messina = require('../');
  const log = messina('Apples');

  sinon.spy(log, 'patchConsole');
  sinon.spy(log, 'catchFatal');

  log.init();
  t.ok(log.patchConsole.calledOnce, 'console patched');
  t.ok(log.catchFatal.calledOnce, 'fatal will be caught');
  t.end();
});

