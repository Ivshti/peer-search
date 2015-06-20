# peer-search

Peer discovery for peer-wire-swarm. 

Supports
* DHT
* UDP trackers
* HTTP trackers
* HTTP URL to a line-separated list of peer IPs; keeps the request open until the server closes it, since the result is parsed line by line and directly added to the peer-wire-swarm

Basic example
```javascript
var PeerSearch = require("peer-search");

new PeerSearch(["dht:INFOHASH"], swarm, { 
  min: 50, // Turns peer searching on when waiting peers on the swarm are less than that
  max: 300 // Turns peer searching off when waiting peers on the swarm are more than that 
});
```
