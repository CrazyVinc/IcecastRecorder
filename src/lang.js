const fs = require('fs');

const merge = require('deepmerge');

const config = require("./config").config;
const defaultLang = require("../lang");
var lang = {};

try {
  if(fs.existsSync(`./lang/${config.lang}.js`)) {
    lang = require(`../lang/${config.lang}.js`);
  }
} catch(err) {
  console.error(err)
}

module.exports = merge(defaultLang, lang);