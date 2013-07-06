
var DHT = require("./");
var async = require("async");

// 8217,4622,7171,4338,10334,2897,4903 -> 42482
// 5275,2300,7371,2982,2250,3455,2788  -> 26421
// 4285,1436,5128,6816,1353,1136,1338  -> 21492

var DHTs = [],
    start = Date.now();

async.each(
    [
        "99cf7a5ae561b7a55072eb07645277b6df0ef902",
        "2b96d97e1de415f0f308f1cf70e9a18567f4a7f9",
        //"ee08430b97ef922bbf123aebf07b43fed29e992d"
    ], 
    function(hash, callback) {
        var dht = new DHT(new Buffer(hash, "hex"));
        DHTs.push(dht);
        dht.findPeers(300);

        var peers = dht.peers = [];
        dht.callback = callback;
        dht.on("peer", function(peer) {
            peers.push(peer);
            if (peers.length == 100) DHTs.forEach(function(d) { if (d != dht) { d.stop(); d.callback() } });
            if (peers.length == 300) callback();
        });
    },
    function(err, res)
    {
        console.log("Ready after", Date.now()-start)
    }
);
