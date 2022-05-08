var kill = require("tree-kill");
const { exec } = require("child_process");
const fs = require("fs");

var moment = require("moment");

require("console-stamp")(console, "HH:MM:ss.l");

const config = require("./src/config").config;

if(config.Stream == "") {
    console.error("Can't record nothing! Please fully configure the recorder in config.json.");
    try {
        process.send("shutdown");
    } catch (e) {
        process.exit(1);
    };    
}

const myArgs = process.argv.slice(2);

process.on("message", function (msg) {
    console.log("Message from main.js:", msg);
    msg = JSON.parse(msg);
    if(msg.msg = "shutdown") {
        running = false;
        kill(RunExternS.pid);
        setTimeout(function () {
            process.send("shutdown");
        }, 5000);
    }
});

if (myArgs.length >= 1) {
    setTimeout(function () {
        running = false;
        kill(RunExternS.pid);
        setTimeout(function () {
            process.exit(1);
        }, 5000);
    }, myArgs[0] * 1000);
}

require("./src/HTTP");
require("./src/Cron");
require("./src/Recorder");

console.log("started");