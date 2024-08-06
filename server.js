process.env.NODE_ENV = process.env.NODE_ENV || "development";

var express = require("./config/express"),
    passport = require("./config/passport"),
    config = require("./config/config"),
    // fs = require(`fs`),
    http = require("http");
    // https = require("https");

var app = express();
passport();
// const options = {
//     key: fs.readFileSync('private.key'),
//     cert: fs.readFileSync('certificate.crt')
// };
// var server = https.createServer(options, app);
var server = http.createServer(app);

server.listen(config.port, () => {
    console.log(`Server is running at http://localhost:${config.port}`)
});
