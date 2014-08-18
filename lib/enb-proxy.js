var argvStrAr = process.argv.join(' ').split('--app');
var argv = argvStrAr[0].split(' ');
argv.push('--app');
argv.push(argvStrAr[1]);
var program = require('commander')
    .version(require('../package.json').version)
    .option('-s, --socket [value]', 'Socket')
    .option('-a, --app [value]', 'App start command with %s for socket')
    .parse(argv);
var spawn = require('child_process').spawn;
var enbSocketName = program.socket + '-enb';
var appSocketName = program.socket + '-app';
var enbServer = new (require('enb/lib/server/server'))();
var Vow = require('vow');
var cdir = process.cwd();
Vow.when(enbServer.init(cdir, {
    socket: enbSocketName
})).then(function () {
    return enbServer.run();
}).then(null, function (err) {
    console.error(err.stack);
    process.exit(1);
});

var appCommandAr = program.app.replace('%s', appSocketName).trim().split(' ');
var appServer = spawn(appCommandAr.shift(), appCommandAr, {
     env: process.env
});

appServer.stdout.pipe(process.stdout);
appServer.stderr.pipe(process.stderr);
appServer.on('error', function (err) {
    console.error(err);
});

/*var enbServer = spawn('enb', ['server', '-s', enbSocketName], {
     env: process.env
});
enbServer.stdout.pipe(process.stdout);
enbServer.stderr.pipe(process.stderr);*/

var httpProxy = require('http-proxy');
var http = require('http');
var proxy = httpProxy.createProxyServer({});
var fs = require('fs');

fs.unlinkSync(program.socket);

var server  = http.createServer(function (req, res) {
    if (req.url.match(/(css|js|png|gif|jpg|svg|ico|ttf|otf|woff|eot|txt|html|json)$/)) {
        proxy.web(req, res, {
            target: {
                socketPath: enbSocketName
            }
        });
    } else {
        proxy.web(req, res, {
            target: {
                socketPath: appSocketName
            }
        });
    }
}).listen(program.socket);

server.on('listening', function () {
    fs.chmod(program.socket, '777');
});

// enbServer.stdout.on('data', function (data) {
//     console.log('data');
//     process.stdout.write(data);
// });
