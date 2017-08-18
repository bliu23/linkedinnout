const express = require('express');
const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const chromeRemoteInterface = require('chrome-remote-interface');
const Promise = require('bluebird');
var fs = require('fs');
var app = express();

const timeout = ms => new Promise(res => setTimeout(res, ms))

// linked in has a stupid auth wall so this prototype and everything else is d-e-d
app.get('/scrape', function(req, res) {
    var chrome;
    var client;
    var url = 'https://www.linkedin.com/authwall?trk=gf&trkInfo=AQEnPG3NMIN2fwAAAV3zuA4AGbH_Vxp5nmGjqKYguGUG6oJjP66eOqXS7UDm5gtuPFQ9MEei1u58Iv4gPFqM3YYPEx3BX1kUCyvyBTMg-6kfmQqNkeQoe1d5Z-Si8gkVzLAtbn0=&originalReferer=&sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fbrandon-liu-29112bb0%2F'
    chromeLauncher.launch({
        port: 9222,
        chromeFlags: [
            '--disable-gpu',
            '--headless'
        ]
    })
    .then(function(chrm) {
        chrome = chrm;
        return chromeRemoteInterface()
            .then(function(clnt) {
                client = clnt
                return Promise.all([
                    client.Page.enable(),
                    client.Network.enable(),
                    client.Runtime.enable()
                ])
            })

    })
    .then(() => {
        return client.Network.clearBrowserCookies()
    })
    .then(function(canClear) {
        canClear ? console.log('cleared browser cookies') : console.log('sad')
        return client.Page.navigate({url: url})
        .then(function() {
            return client.Page.loadEventFired();
        })
    }).then(Promise.delay(3000))
    .then(function() {
        return client.Page.printToPDF({
            printBackground: true,
            marginTop: 0.25,
            marginBottom: 0.25,
            marginLeft: 0.25,
            marginRight: 0.25,
            paperWidth: 8.5,
            paperHeight: 11
        }).then(function(data) {
            console.log(data)
            return fs.writeFileSync('page2.pdf', data.data, 'base64')
        })
    })
    .then(function(data) {
        function getDoc() {
            return document;
        }
        var exp = getDoc.toString();
        return client.Runtime.evaluate({expression: exp})
    })
    .then(function(ret) {
        console.log(ret);
        chrome.kill();
    })
    res.send('Hello world');
});

app.listen(3000);
console.log('check out the magic at localhost 3000');

exports = module.exports = app;
