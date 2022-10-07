const { fork } = require("child_process");

console.log("Starting Icecast Recorder.");

let recorder;
var running = false;

const myArgs = process.argv.slice(2);

if (myArgs.length >= 1) {
    console.log(myArgs);
    //? Cancel run if argument 0 is not a number
    if(isNaN(myArgs[0])) {
        console.error("Argument 0 must be a number.");
        return;
    }
    setTimeout(function () {
        //? Send a shutdown signal to the Recorder.
        running = true;
        recorder.send(JSON.stringify({msg: "shutdown"}));
    }, myArgs[0] * 1000);
}

function makeJSON(jsonObj) {
    try {
        return JSON.parse(jsonObj);
    } catch (e) {
        return {msg: jsonObj};
    }
}

function launch() {
    recorder = fork("./index.js");
    recorder.on("message", function (msg) {
        msg = makeJSON(msg);
        if(msg.msg == "restart") {
            recorder.kill();
            launch();
        } else if(msg.msg == "shutdown") {
            recorder.kill();
            process.exit(1);
        } else {
            console.log(msg);
        }
    });

    recorder.on("close", function (code) {
        console.log("Icecast Recorder exited with code " + code);
        if(running) {
            console.log("Restarting...");
            launch();
        }
    });
}

launch();