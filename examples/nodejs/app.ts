const http = require('http');
const blunderClient = require('blunder-js');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
  throw new Error('I am an uncaught exception');
}).listen(8080);

console.log('Server running on port 8080.');

const blunder = new blunderClient({
  projectId: 1,
  projectKey: 'FIXME',
  component: 'node-app'
});
