var express = require("express"),
    morgan = require("morgan"),
    passport = require("passport"),
    cors = require("cors"),
    methodOverride = require("method-override"),
    path = require("path"),
    routers = require("./routers");

module.exports = () => {

    var app = express();    

    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({
        limit: "1mb",
        extended: true
    }));
    // app.use(bodyParser.json({ limit: "1mb" }));
    // app.use(bodyParser.urlencoded({ limit: "1mb", extended: true }));
    app.use(cors());
    app.use(morgan("dev"));
    app.use(methodOverride());

    app.use(passport.initialize());
    app.use(passport.session());
    // app.use(express.static(path.join(__dirname, 'build')))
    // app.get('*', (req, res) => {
    //     res.sendFile(path.join(__dirname, 'build', 'index.html'));
    //   });

    routers.map(router => {
        app.use(`/api/${router}`, require(`../routers/${router}.router`));
    });

    return app;
}