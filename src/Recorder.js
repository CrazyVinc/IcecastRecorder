var kill = require("tree-kill");
const { exec } = require("child_process");
const fs = require("fs");


var moment = require("moment");
var pathToFfmpeg = require("ffmpeg-static");


const config = require("./config").config;
const lang = require("./lang");
require("./globals");

function RunExtern() {
    FFMPEGStarted = new Date();
    RunningFFMPEG = true;
    var time = {
        MM: ("0" + (moment().month() + 1)).slice(-2),
        DD: ("0" + (moment().date())).slice(-2),
        HH: ("0" + (moment().hour())).slice(-2),
        Min: ("0" + (moment().minute())).slice(-2),
        SS: ("0" + (moment().second())).slice(-2)
    };

    var OnlyLetterNumber = /([a-zA-Z0-9-_]*)/g;
    time.MM = lang.folders.months[(moment().month() + 1)].match(OnlyLetterNumber)[0];    

    RunExternS = exec(
        pathToFfmpeg +
            " -i " +
            config.Stream +
            ' "Recs/' +
            moment().year() + "/" + 
            time.MM + "/" +
            time.DD + "/" + lang.filename.prefix +
            time.HH + lang.filename.hour_minute + time.Min + 
            lang.filename.minute_second + time.SS
             +'.mp3"'
    );
    RunExternS.stdout.on("data", (data) => {
        console.log(`${data}`);
    });

    RunExternS.stderr.on("data", (data) => {
        console.log(`${data}`);
    });

    RunExternS.on("close", (code) => {
        console.log(`Icecast recorder exited with code ${code}`);
        RunningFFMPEG = false;
        if(running) {
            global.job.start();

            kill(RunExternS.pid);
            RunExtern();
        }
    });
}

module.exports = {
    RunExtern
}