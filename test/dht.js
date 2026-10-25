var assert = require('assert')
var EventEmitter = require('events').EventEmitter
var fs = require('fs')
var path = require('path')
var vm = require('vm')

// Exercise the real wrapper with a controllable DHT client and clock.
// No public swarm, DNS, sockets or third-party test dependencies are needed.
function fixture(synchronous) {
  var now = 0, nextId = 0, timers = [], calls = [], client
  function schedule(fn, delay) {
    var timer = { id: ++nextId, at: now + delay, fn: fn, cancelled: false }
    timers.push(timer)
    return timer
  }
  function tick(ms) {
    var end = now + ms, next
    while ((next = timers.filter(function(t) {
      return !t.cancelled && t.at <= end
    }).sort(function(a, b) { return a.at - b.at || a.id - b.id })[0])) {
      next.cancelled = true
      now = next.at
      next.fn()
    }
    now = end
  }
  function Client() {
    client = this
    EventEmitter.call(this)
  }
  Client.prototype = Object.create(EventEmitter.prototype)
  Client.prototype.lookup = function(hash, callback) {
    var call = { hash: hash, callback: callback, aborted: 0 }
    calls.push(call)
    if (synchronous && callback) callback()
    return function() { call.aborted++ }
  }
  Client.prototype.destroy = function(callback) { if (callback) callback() }
  var module = { exports: {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dht.js'), 'utf8'), {
    module: module,
    require: function(name) { return name === 'bittorrent-dht' ? Client : require(name) },
    setTimeout: schedule,
    clearTimeout: function(timer) { timer.cancelled = true }
  }, { filename: 'dht.js' })
  var source = new module.exports('0000000000000000000000000000000000000001')
  source.numRequests = 0
  return { source: source, client: client, calls: calls, tick: tick }
}

function test(name, run) {
  try { run(); console.log('ok - ' + name) }
  catch (error) { process.exitCode = 1; console.error('not ok - ' + name); console.error(error.message) }
}

test('a completed lookup can be retried by the next run', function() {
  var f = fixture()
  f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls.length, 1)
  assert.strictEqual(typeof f.calls[0].callback, 'function')
  f.calls[0].callback()
  f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls.length, 2)
  assert.strictEqual(f.source.numRequests, 2)
})

test('an active or scheduled lookup is not duplicated', function() {
  var f = fixture()
  f.source.run(); f.source.run(); f.tick(1500)
  f.source.run(); f.tick(30000)
  assert.strictEqual(f.calls.length, 1)
})

test('completion of a paused lookup cannot clear the current lookup', function() {
  var f = fixture()
  f.source.run(); f.tick(1500)
  f.source.pause(); f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls[0].aborted, 1)
  assert.strictEqual(f.calls.length, 2)
  assert.strictEqual(typeof f.calls[0].callback, 'function')
  f.calls[0].callback()
  f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls.length, 2)
  f.calls[1].callback()
  f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls.length, 3)
})

test('synchronous completion does not leave a stale abort handle', function() {
  var f = fixture(true)
  f.source.run(); f.tick(1500)
  f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls.length, 2)
})

test('pause cancels a lookup that has not started', function() {
  var f = fixture()
  f.source.run(); f.source.pause(); f.tick(1500)
  assert.strictEqual(f.calls.length, 0)
  f.source.run(); f.tick(1500)
  assert.strictEqual(f.calls.length, 1)
})
