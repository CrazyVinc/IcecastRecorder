const http = require("http");
const { exec } = require("child_process");
const fs = require("fs");
const {
    promises: { readdir },
} = require("fs");
var cp = require("child_process");
var pathToFfmpeg = require('ffmpeg-static');

require('console-stamp')(console, 'HH:MM:ss.l');

let config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var express = require("express");
let ejs = require("ejs");

var moment = require("moment");

var CronJob = require("cron");

process.on("message", function (message) {
    console.log(`Message from main.js: ${message}`);
});

var RunningFFMPEG = false;
var FFMPEGStarted;
var RunExternS;

function RunExtern() {
    FFMPEGStarted = new Date();
    RunningFFMPEG = true;
    RunExternS = exec(pathToFfmpeg+ ' -i '+config.Stream+' -c copy -f segment -segment_time 3600 -strftime 1 -reset_timestamps 1 -segment_format mp3 "Recs/%Y/%m/%d/%H-%M-%S.mp3"');
    RunExternS.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    console.log("started")
    
    RunExternS.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    
    RunExternS.on('close', (code) => {
        console.log(`Auto Updater exited with code ${code}`);
        RunningFFMPEG = false;
        job.start();
        RunExtern();
    });
}

var RunRecorder = new CronJob.CronJob('00 00 * * * *', function() {
    if(!RunningFFMPEG) {
        RunExtern();
        return;
    }
    let HH = FFMPEGStarted.getHours();
    let mm = FFMPEGStarted.getMinutes();
    let SS = FFMPEGStarted.getSeconds();
    
    if(mm !== 0 && SS !== 0) {
        RunExternS.kill();
        RunExtern();
    }
}, null, true, null, null, true);

var job = new CronJob.CronJob('0 55 * * * *', function() {
    let date_ob = moment().add(5, 'minutes');
    let DD = ("0" + date_ob.date()).slice(-2);
    // current month
    let MM = ("0" + (date_ob.month() + 1)).slice(-2);
    // current year
    let YYYY = date_ob.year();
    
    // prints date in YYYY-MM-DD format
    var RecPath = ["Recs/"+YYYY+"/"+MM+"/"+DD]

    for (let i = 0; i < 2; i++) {
        let date_ob = moment().add(i, 'days');
        let DD = ("0" + date_ob.date()).slice(-2);
        // current month
        let MM = ("0" + (date_ob.month() + 1)).slice(-2);
        // current year
        let YYYY = date_ob.year();
        RecPath.push("Recs/"+YYYY+"/"+MM+"/"+DD)
    }


    RecPath.forEach(RecPath => {
        if (!fs.existsSync(RecPath)){
            console.log("Make folder");
            fs.mkdirSync(RecPath, { recursive: true });
        }
    });
  }, null, true, null, null, true);


const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");

app.use("/", require("./src/routes"));
app.use("/assets", express.static("assets"));

app.set("port", 8085);
server.listen(app.get("port"), () => {
    console.log("The LEDController server is running on port:", 8085);
});
