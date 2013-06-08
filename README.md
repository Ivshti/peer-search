<<<<<<< HEAD
# bittorrent-dht

a lightweight implementation of the BitTorrent DHT
=======
# peer-wire-swarm

a peer swarm implementation that uses the torrent DHT to find peers

	npm install peer-wire-swarm

# usage

``` js
var wireSwarm = require('peer-wire-swarm');
var swarm = wireSwarm(myInfoHash, myPeerId);

swarm.on('wire', function(wire) {
	// a relevant peer-wire-protocol as appeared
	// see the peer-wire-protocol module for more info

	wire.on('unchoke', function() {
		// we are now unchoked
	});

	swarm.wires // <- list of all connected wires
});

swarm.listen();
```
>>>>>>> 177c1858e13391660ed061de6bcff53b57d194c0
