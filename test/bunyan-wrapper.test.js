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

  t.test('string argument', function (t) {
    var log = messina('Apples');
    t.ok(bunyan.createLogger.calledWithMatch({ name: 'Apples' }), "string used as name");
    bunyan.createLogger.reset();
    t.end();
  });

  t.test('obj argument', function (t) {
    var log = messina({name: 'Apples' });
    t.ok(bunyan.createLogger.calledWithMatch({ name: 'Apples' }), "options object used");
    bunyan.createLogger.reset();
    t.end();
  });
});

test('init', function(t) {
  const messina = require('../');
  const log = messina('Apples');
  log.init();

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

