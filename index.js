const http = require("http");
const os = require("os");
var path = require("path");
const { spawn, fork } = require("child_process");
var fs = require("fs");
const {
    promises: { readdir },
} = require("fs");
var cp = require("child_process");

var express = require("express");
let ejs = require("ejs");
var bodyParser = require("body-parser");

var moment = require("moment");

var CronJob = require("cron");

process.on("message", function (message) {
    console.log(`Message from main.js: ${message}`);
});

var RunningFFMPEG = false;
var FFMPEGStarted;
var RunExternS;

function platform2() {
    var platform = os.platform();
    if (platform == "win32") {
        return "windows.cmd";
    } else if (platform == "linux") {
        return "linux.sh";
    } else {
        return platform;
    }
}

function RunExtern() {
    FFMPEGStarted = new Date();
    RunningFFMPEG = true;
    RunExternS = spawn("./bin/"+platform2());
    RunExternS.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    
    RunExternS.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    RunExternS.on('close', (code) => {
        console.log(`Auto Updater exited with code ${code}`);
        RunningFFMPEG = false;
        job.start();
        RunExtern();
    });
}
RunExtern();

var RunRecorder = new CronJob.CronJob('59 59 * * * *', function() {
    let HH = FFMPEGStarted.getHours();
    let mm = FFMPEGStarted.getMinutes();
    let SS = FFMPEGStarted.getSeconds();
    
    if(mm !== 0 && SS !== 0) {
        RunExternS.kill('SIGHUP');
        RunExtern();
    }
}, null, true, null, null, true);


var job = new CronJob.CronJob('30 57 * * * *', function() {
    let date_ob = new Date();
    let DD = ("0" + date_ob.getDate()).slice(-2);
    // current month
    let MM = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    // current year
    let YYYY = date_ob.getFullYear();
    
    // prints date in YYYY-MM-DD format
    var RecPath = [
        "Recs/"+YYYY+"/"+MM+"/"+DD,
        "Recs/"+(YYYY+1)+"/"+MM+"/"+DD,
        "Recs/"+YYYY+"/"+(MM+1)+"/"+DD,
        "Recs/"+YYYY+"/"+MM+"/"+(DD+1),
    ]
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

app.use("/assets", express.static("assets"));

const getDirectories = async (source) =>
    (await readdir(source, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
const getFiles = async (source) =>
    (await readdir(source, { withFileTypes: true }))
        .filter((dirent) => dirent.isFile())
        .map((dirent) => dirent.name);

app.get("/", async function (req, res) {
    console.log(await getDirectories("./Recs"));
    res.render("YYYY", { Years: await getDirectories("./Recs") });
});
app.get("/:YYYY([0-9]{4})", async function (req, res) {
    res.render("MM", {
        Months: await getDirectories("./Recs/"+req.params.YYYY),
        Selected: {
            YYYY: req.params.YYYY
        }
    });
});
app.get("/:YYYY([0-9]{4})/:MM([0-9]{2})", async function (req, res) {
    res.render("DD", {
        Days: await getDirectories("./Recs/"+req.params.YYYY+"/"+req.params.MM),
        Selected: {
            YYYY: req.params.YYYY,
            MM: req.params.MM
        }
    });
});
app.get("/:YYYY([0-9]{4})/:MM([0-9]{2})/:DD([0-9]{2})", async function (req, res) {
    res.render("audio", {
        Days: await getFiles("./Recs/"+req.params.YYYY+"/"+req.params.MM+"/"+req.params.DD),
        Selected: {
            YYYY: req.params.YYYY,
            MM: req.params.MM,
            DD: req.params.DD
        }
    });
});

app.get("/:YYYY([0-9]{4})/:MM([0-9]{2})/:DD([0-9]{2})/:mp3", async function (req, res) {
    var RecPath = "Recs/"+req.params.YYYY+"/"+req.params.MM+"/"+req.params.DD+"/"+req.params.mp3;
    if(fs.existsSync(RecPath)) {
        res.sendFile(path.resolve(RecPath))
    } else {
        res.status(404).render("errors", { error: { code: "File not found!" } });
    }
});

app.get("*", function (req, res) {
    res.status(404).render("errors", { error: { code: "404" } });
    // res.redirect("/home");
});

app.set("port", 8085);
server.listen(app.get("port"), () => {
    console.log("The LEDController server is running on port:", 8085);
});
