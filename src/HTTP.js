const http = require("http");

var moment = require("moment");

// require("console-stamp")(console, "HH:MM:ss.l");

var express = require("express");
let ejs = require("ejs");

const config = require("./config").config;


const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");

app.use("/", require("./routes"));
app.use("/assets", express.static("assets"));

//? Is WebPort a valid number
if(isNaN(config.webport)) {
    console.warn("The webserver requires a number to be specified in config.json by WebPort. Running without Webserver.");
} else {
    app.set("port", config.webport);

    server.listen(app.get("port"), () => {
        console.log("Icecast Recorder webserver is running on port:", config.webport);
    });
}