var kill = require("tree-kill");
const fs = require("fs");

var moment = require("moment");
var CronJob = require("cron");

require("./globals");
const {RunExtern} = require("./Recorder");
const config = require("./config").config;
const lang = require("./lang");

job = new CronJob.CronJob(
    "0 55 * * * *",
    function () {
        let date_ob = moment().add(5, "minutes");
        let DD = ("0" + date_ob.date()).slice(-2);
        // current month
        let MM = (date_ob.month() + 1);
        // current year
        let YYYY = date_ob.year();

        // prints date in YYYY-MM-DD format
        
        OnlyLetterNumber = /([a-zA-Z0-9-_]*)/g;
        MM = lang.folders.months[MM].match(OnlyLetterNumber)[0];    

        var RecPath = ["Recs/" + YYYY + "/" + MM + "/" + DD];

        for (let i = 0; i < 2; i++) {
            let date_ob = moment().add(i, "days");
            let DD = ("0" + date_ob.date()).slice(-2);
            // current month
            let MM = (date_ob.month() + 1);
            MM = lang.folders.months[MM].match(OnlyLetterNumber)[0];    
            // current year
            let YYYY = date_ob.year();
            RecPath.push("Recs/" + YYYY + "/" + MM + "/" + DD);
        }

        RecPath.forEach((RecPath) => {
            if (!fs.existsSync(RecPath)) {
                fs.mkdirSync(RecPath, { recursive: true });
            }
        });
    }, null, true, null, null, true);


var RunRecorder = new CronJob.CronJob(
    "00 00 * * * *",
    function () {
        if (!RunningFFMPEG) {
            RunExtern();
            return;
        }
        kill(RunExternS.pid);
    }, null, true, null, null, true);


module.exports = {
    job, RunRecorder
};
