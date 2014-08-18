var program = require('commander')
    .version(require('../package.json').version)
    .option('-s, --socket [value]', 'Socket')
    .parse(process.argv);
var spawn = require('child_process').spawn;
var enbSocketName = program.socket + '-enb';
var enbServer = spawn('enb', ['server', '-s', enbSocketName], {
     env: process.env
});
enbServer.stdout.pipe(process.stdout);
enbServer.stderr.pipe(process.stderr);
var httpProxy = require('http-proxy');
var http = require('http');
var proxy = httpProxy.createProxyServer({});
var fs = require('fs');

fs.unlinkSync(program.socket);

console.log('listen', program.socket);
var server  = http.createServer(function (req, res) {
    console.log(req.url);
    proxy.web(req, res, {
        target: {
            socketPath: enbSocketName
        }
    });
}).listen(program.socket);

server.on('listening', function () {
    fs.chmod(program.socket, '777');
});

// enbServer.stdout.on('data', function (data) {
//     console.log('data');
//     process.stdout.write(data);
// });
