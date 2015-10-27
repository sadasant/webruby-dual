var connect = require('connect');
var path = __dirname;
connect.createServer(
    connect.static(path)
).listen(8080);
console.log("Go to: http://localhost:8080/");
