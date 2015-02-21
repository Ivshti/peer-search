# peer-search

Peer discovery for peer-wire-swarm. Can use DHT, peer pumps (HTTP request that streams a list of peers). Planned support for trackers.

Basic example
```javascript
var PeerSearch = require("peer-search");

new PeerSearch(["dht:INFOHASH"], swarm, { 
  min: 50, // Turns peer searching on when waiting peers on the swarm are less than that
  max: 300 // Turns peer searching off when waiting peers on the swarm are more than that 
});
```
