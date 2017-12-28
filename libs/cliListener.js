var events = require('events');
var net = require('net');

var listener = module.exports = function listener(port){

    var _this = this;

    var emitLog = function(text){
        _this.emit('log', text);
    };

    // TODO, pull configDetails in
    // TODO, allow specific IPs
    // TODO, bind to any interface, not 127.0.0.1
    
    var bindToIp = "0.0.0.0";
    var allowIPs = ["127.0.0.1","::ffff:127.0.0.1"];
    
    this.start = function(){
        net.createServer({allowHalfOpen: false}, function(c) {
            var dropped = false;
            var data = '';
            var ip = c.remoteAddress;
            c.setEncoding('ascii');
            c.on('close', function () {
                dropped = true;
            });
            c.on('error', function () {
                dropped = true;
            });
            //console.log(ip);
            //console.log(allowIPs.indexOf(ip));
            if (allowIPs.indexOf(ip) >= 0) {
                c.on('data', function (d) {
                    if (dropped || c.destroyed)
                        return;
                    try {
                        data += d;
                        if (data.slice(-1) === '\n') {
                            var message = JSON.parse(data);
                            _this.emit('command', message.command, message.params, message.options, function(message){
                                c.end(message);
                            });
                        }
                    }
                    catch(e){
                        emitLog('CLI listener failed to parse message from ' + ip + ' data: ' + data);
                        dropped = true;
                        c.destroy();
                    }
                    // flooded?
                    if (data.length > 10240) {
                        data="";
                        dropped = true;
                        socket.destroy();
                    }
                });
            } else {
                dropped = true;
                c.destroy();
            }
        }).listen(port, function() {
            emitLog('CLI listening on port ' + port);
        });
    }

};

listener.prototype.__proto__ = events.EventEmitter.prototype;
