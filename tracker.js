var trackerCli = require('bittorrent-tracker')
var EventEmitter = require('events').EventEmitter
var dns = require('dns')
var net = require('net')
var url = require('url')

var hosts = {}

function resolveAnnounce(announce, cb)
{
    var parsed = url.parse(announce)
    var host = parsed.hostname
    if (parsed.protocol !== 'udp:' || !host || net.isIP(host)) return cb(announce)

    var cached = hosts[host]
    if (cached && cached.expires > Date.now()) return cb(cached.ip ? announce.replace(host, cached.ip) : null)

    dns.resolve4(host, function(err, ips) {
        var ip = !err && ips && ips.length ? ips[0] : null
        if (err && err.code !== 'ENOTFOUND' && err.code !== 'ENODATA') ip = host
        hosts[host] = { ip: ip, expires: Date.now() + (ip ? 10 * 60 * 1000 : 60 * 1000) }
        cb(ip ? announce.replace(host, ip) : null)
    })
}

function Tracker(url, opts, infoHash)
{
    var self = this;
    EventEmitter.call(this);
    
    // TODO
    var peerId = new Buffer('01234567890123456789')
    var port = 6881
    var client, closed

    this.run = function() {
        self.numRequests++
        
        resolveAnnounce(url, function(announce) {
            if (!announce || closed) return
            if (client) return client.update()

            client = new trackerCli(peerId, port, { infoHash: infoHash, announce: [announce] })
            client.start()
            client.on('peer', function(addr) { self.emit('peer',addr) })
        })
    };

    this.pause = function() {

    };

    this.close = function() {
        closed = true
        if (client) client.destroy()
    };
};
Tracker.prototype.__proto__ = EventEmitter.prototype;
module.exports = Tracker;