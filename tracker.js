var dgram = require("dgram");
var hat = require("hat");
var EventEmitter = require("events").EventEmitter;
var bncode = require("bncode");
var needle = require("needle");

var BufferUtils = require("./bufferutils");

var REQUEST_TIMEOUT = 1000; // a timeout on an individual UDP announce request

var CONNECTION_ID = BufferUtils.concat(
  BufferUtils.fromInt(0x417), 
  BufferUtils.fromInt(0x27101980)
);

var Action = {
  CONNECT: 0,
  ANNOUNCE: 1,
  SCRAPE: 2,
  ERROR: 3
};

function getTransactionId()
{
    var id = new Buffer(4);
    id[0] = Math.random() * 255;
    id[1] = Math.random() * 255;
    id[2] = Math.random() * 255;
    id[3] = Math.random() * 255;
    return getTransactionId.last = id;    
}

function parsePeers(buf)
{
    var output = [];
    for (var i = 0; i <= buf.length - 1; i = i + 6) {
        var seg = buf.slice(i, i + 6);
        output.push(seg[0] + "." + seg[1] + "." + seg[2] + "." + seg[3] + ":" + seg.readUInt16BE(4));
    }
    return output;
}

var getTorrentInfo = function(tracker, infoHash, cb)
{
    /* Ensure we never call the callback twice, and we timeout after 4 seconds */
    /*
    
    // TODO: a much shorter timeout (1 second) which kills the connection and changes the tracker if we don't have a single response in half a second
    setTimeout(function() { callback(new Error("Unable to receive torrents information from tracker")) }, 4000);
    setTimeout(function() { if (! hasAnnounced) callback(new Error("Unable to connect to tracker")) }, 1000);
    */
    
    /* Init connection */
    var requests = {}, socket;
    function send(packet)
    {
        var req = requests[getTransactionId.last.toString("hex")] = { id: getTransactionId.last.toString("hex") };
        try {
          socket.send(packet, 0, packet.length, tracker.port, tracker.hostname, function(err) { err && console.error("tracker", err) });
        } catch(e) { console.error("tracker",e);  }
        return req;
    };
    
    var connectCb, connectionId, connect = function(callback)
    {
        socket = dgram.createSocket("udp4", handle).on("error", function(e) { console.error("torrentInfo - creating socket", e.message) });
        socket.on("error", function(e) { console.error(e) });
        send(BufferUtils.concat(CONNECTION_ID, BufferUtils.fromInt(Action.CONNECT), getTransactionId()));
        connectCb = function(id) { connectionId = id; callback() };
    };
    
    function handle(msg)
    {
        var action = BufferUtils.readInt(msg);
        
        if (action == Action.CONNECT) return connectCb(BufferUtils.slice(msg, 8, 16));
        if (action == Action.ANNOUNCE) return announceHandle(msg);
        
        var errMsg = BufferUtils.slice(msg, 8).toString();
        if (action == Action.ERROR) return console.error("torrentInfo - handling message", errMsg)
        console.log("Unknown response", action, errMsg);
    };

    function announceHandle(msg)
    {
        var reqId = BufferUtils.slice(msg, 4, 8).toString("hex"), req = requests[reqId];
        if (! req) return console.log("Unknown request ID"); /* Something went wrong here */
        if (req.callback) req.callback(msg);
        delete requests[reqId];
    }

    connect(function()
    {
        var data = {
            event: "started",
            info_hash: new Buffer(infoHash, "hex"),
            peer_id: new Buffer('-PF0005-'+hat(48)),
            port: 1111 // does not matter
        };

        var req = send(BufferUtils.concat(connectionId,
          BufferUtils.fromInt(Action.ANNOUNCE), 
          getTransactionId(), data.info_hash, data.peer_id,
          BufferUtils.fromInt(0), BufferUtils.fromInt(data.downloaded || 0), // int64, TODO: split data into two parts etc
          BufferUtils.fromInt(0), BufferUtils.fromInt(data.left || 0), // 64
          BufferUtils.fromInt(0), BufferUtils.fromInt(data.uploaded || 0), //64
          BufferUtils.fromInt(data.event),
          BufferUtils.fromInt(0), 
          BufferUtils.fromInt(Math.random() * 255),
          BufferUtils.fromInt(200),
          BufferUtils.fromInt16(data.port)
        ));
                    
        var received = false, timeout = setTimeout(function()
        {
            if (socket) socket.close();
            
            if (received) return;
            req.callback = null; // ensure that's not called in case our response comes after the timeout

            cb();
            
            /*
             * we don't have a queue and re-trying is not critical here
            if (retries == MAX_RETRIES)
                return task.cb(new Error("Retried more than "+MAX_RETRIES+" times on infoHash: "+task.infoHash+", giving up"));
            
            // Re-push the task
            retries++;
            workerQueue.unshift(task);
            */
        }, REQUEST_TIMEOUT);
        
        req.callback = function(msg)
        {
            if (socket) socket.close();
        
            clearTimeout(timeout);
            received = true;

            cb(null, {
                interval: BufferUtils.readInt(msg, 8),
                leechers: BufferUtils.readInt(msg, 12),
                seeders: BufferUtils.readInt(msg, 16),
                peers: parsePeers(msg.slice(20)), /* parsing peers is not needed ; slice at offset 20 */
                infoHash: infoHash,            
            }, tracker);
        };
    });
    
};

function getTorrentInfoHTTP(tracker, infoHash, ready)
{
    tracker.query.info_hash = escape(infoHash.toString("binary"));
    tracker.query.peer_id = escape(new Buffer('-PF0005-'+hat(48)).toString()),
    tracker.query.port = 10000; // something?
    tracker.query.uploaded = 0;
    tracker.query.downloaded = 0;
    tracker.query.event = "started";
    tracker.search = "?";
    for (key in tracker.query) {
        tracker.search += key +"=" + tracker.query[key] + "&";
    }
    needle.get(require("url").format(tracker), function(err, resp) {
        if (err) return ready(err);
        if (! (resp && resp.raw)) return ready(new Error("blank response"));
        try { 
            var resp = bncode.decode(resp.raw);
            if (Array.isArray(resp.peers)) resp.peers = resp.peers.map(function(p) { return new Buffer(p.ip).toString()+":"+p.port });
            ready(null, resp);
        } catch(e) { ready(e) };
    });
}

function Tracker(url, options, infoHash)
{
    var self = this;
    EventEmitter.call(this);

    this.run = function() {
        var ready = function(err, inf) { 
            if (err) console.error(err);
            if (inf && Array.isArray(inf.peers)) inf.peers.forEach(function(p) { self.emit("peer", p) }) 
        };
        self.numRequests++;
        var tracker = require("url").parse(url, true);
        if (tracker.protocol.match("^http")) return getTorrentInfoHTTP(tracker, infoHash, ready);
        tracker.port = parseInt(tracker.port);
        getTorrentInfo(tracker, infoHash, ready);
    };

    this.pause = function() {
    };
};
Tracker.prototype.__proto__ = EventEmitter.prototype;
module.exports = Tracker;

