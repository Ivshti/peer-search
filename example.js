var DHT = require('./dht');

/*
async.eachSeries(
    [
        '72F242DB89E763B6CE390F25D576195C2169B149',
    ], 
    function(hash, callback) {
        var dht = new DHT(hash);

        dht.run();

        var peers = [], start = Date.now(), i = 0;
        dht.on('peer', function(peer) {
            peers.push(peer);
            if (peers.length != 150) return;

            dht.pause();
            console.log("\n\n\nready: "+(Date.now() - start)+"\n\n"); // 2 - 3 seconds
            //setTimeout(callback, 4000);
            callback();
        });
    }
);
*/


var Tracker = require("./tracker");
var tracker = new Tracker("udp://tracker.openbittorrent.com:80/announce", {}, "72F242DB89E763B6CE390F25D576195C2169B149");
tracker.run();
tracker.on("peer",function(addr){console.log(addr)})

