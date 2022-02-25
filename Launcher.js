const { spawn, fork } = require("child_process");
const fs = require('fs');

console.log("Starting Icecast Recorder.");

let RunExternS;
let ForkJSS;
let child;

function launch() {
    child = fork("./index.js");
    child.on("message", function (msg) {
        msg = JSON.parse(msg) || {msg: msg};
        if(msg.msg == "restart index") {
        } else if(msg.msg == "run fork") {
            console.log("Executing fork: ", msg.exec)
            child.kill();
            forkJSS = forkJS(msg.exec);
        } else if(msg.msg == "run extern") {
            console.log("Executing extern script: ", msg.exec)
            child.kill();
            RunExternS = RunExtern(msg.exec);
        } else {
            console.log(`Message from LED Controller: ${msg}`);
        }
    });

    child.on("close", function (code) {
        console.log("Led Controller exited with code " + code);
    });
}

function forkJS(exec) {
    ForkJSS = fork("./index.js");
    ForkJSS.on("message", function (msg) {
        msg = JSON.parse(msg) || {msg: msg};
        if(msg.msg == "launch index") {
            ForkJSS.kill();
            console.log("Launching index..")
            child = launch();
        } else {
            console.log(`Message from LED Controller: ${msg}`);
        }
    });

    child.on("close", function (code) {
        console.log("Led Controller exited with code " + code);
    });
}
function RunExtern(exec) {
    RunExternS = spawn(exec);
    RunExternS.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    RunExternS.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    RunExternS.on('close', (code) => {
      console.log(`Auto Updater exited with code ${code}`);
      Controller();
    });
}

launch();