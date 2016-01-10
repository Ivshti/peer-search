var trackerCli = require('bittorrent-tracker')
var EventEmitter = require('events').EventEmitter

function Tracker(url, opts, infoHash)
{
    var self = this;
    EventEmitter.call(this);
    
    // TODO
    var peerId = new Buffer('01234567890123456789')
    var port = 6881

    this.run = function() {
        var client = new trackerCli(peerId, port, { infoHash: infoHash, announce: [url] })
        client.start()
        client.on('peer', function(addr) { self.emit('peer',addr) })
    };

    this.pause = function() {

    };
};
Tracker.prototype.__proto__ = EventEmitter.prototype;
module.exports = Tracker;