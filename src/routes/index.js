var path = require("path");
const fs = require("fs");
const {
    promises: { readdir },
} = require("fs");


var express = require("express");
let ejs = require("ejs");
var app = express.Router();

require('console-stamp')(console, 'HH:MM:ss.l');

const getDirectories = async (source) =>
    (await readdir(source, { withFileTypes: true }))
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
const getFiles = async (source) =>
    (await readdir(source, { withFileTypes: true }))
        .filter((dirent) => dirent.isFile())
        .map((dirent) => dirent.name);

app.get("/", async function (req, res) {
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

module.exports = app;