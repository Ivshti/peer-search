var DHT = require('./dht');
var async = require('async');

/*
async.eachSeries(
//async.each(
    [
        '83a52c36b9e7b101aae77721dc1a1f5193fc8a39',
     //   'e756b6ed7f1f647db2ea7e153e2fdc6226218a1f',
     //   '948cd498ab5acdc0a61dee8b012eb93ae231b2ff',
    ], 
    function(hash, callback) {
        var dht = new DHT(new Buffer(hash, 'hex'));

        dht.run();

        var peers = [], start = Date.now(), i = 0;
        dht.on('peer', function(peer) {
            peers.push(peer);
            if (peers.length != 300) return;

            dht.pause();
            console.log("\n\n\nready: "+(Date.now() - start)+"\n\n"); // 2 - 3 seconds
            //setTimeout(callback, 4000);
            callback();
        });
    }
);
*/

var Tracker = require("./tracker");
var tracker = new Tracker("udp://open.demonii.com:1337/announce", {}, "89e3d46d609b122a4782fe6eb269823a1ff18a74");
tracker.run();
tracker.on("peer",function(addr){console.log(addr)})
