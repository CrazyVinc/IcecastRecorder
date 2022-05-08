var kill = require("tree-kill");
const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");

var express = require("express");
let ejs = require("ejs");

var moment = require("moment");
var CronJob = require("cron");
var pathToFfmpeg = require("ffmpeg-static");
require("console-stamp")(console, "HH:MM:ss.l");

let config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

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

var RunningFFMPEG = false;
var running = true;
var FFMPEGStarted;
var RunExternS;


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
    RunExternS = exec(
        pathToFfmpeg +
            " -i " +
            config.Stream +
            ' "Recs/' +
            moment().year() + "/" + 
            time.MM + "/" +
            time.DD + "/" +
            time.HH + ';' + time.Min + '!'+time.SS
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
            job.start();
            kill(RunExternS.pid);
            RunExtern();
        }
    });
}

var RunRecorder = new CronJob.CronJob(
    "00 00 * * * *",
    function () {
        if (!RunningFFMPEG) {
            RunExtern();
            return;
        }
        kill(RunExternS.pid);
    },
    null,
    true,
    null,
    null,
    true
);

var job = new CronJob.CronJob(
    "0 55 * * * *",
    function () {
        let date_ob = moment().add(5, "minutes");
        let DD = ("0" + date_ob.date()).slice(-2);
        // current month
        let MM = ("0" + (date_ob.month() + 1)).slice(-2);
        // current year
        let YYYY = date_ob.year();

        // prints date in YYYY-MM-DD format
        var RecPath = ["Recs/" + YYYY + "/" + MM + "/" + DD];

        for (let i = 0; i < 2; i++) {
            let date_ob = moment().add(i, "days");
            let DD = ("0" + date_ob.date()).slice(-2);
            // current month
            let MM = ("0" + (date_ob.month() + 1)).slice(-2);
            // current year
            let YYYY = date_ob.year();
            RecPath.push("Recs/" + YYYY + "/" + MM + "/" + DD);
        }

        RecPath.forEach((RecPath) => {
            if (!fs.existsSync(RecPath)) {
                fs.mkdirSync(RecPath, { recursive: true });
            }
        });
    },
    null,
    true,
    null,
    null,
    true
);


const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");

app.use("/", require("./src/routes"));
app.use("/assets", express.static("assets"));

app.set("port", 8085);


server.listen(app.get("port"), () => {
    console.log("The LEDController server is running on port:", 8085);
});

console.log("started");