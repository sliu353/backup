"use strict";

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const spawn = require("child_process");
var cmd = require("node-cmd");
const http = require("http");
const fs = require('fs');
//var request = require('request');
const axios = require("axios");
const url = require('url');
var fsExtra = require('fs-extra');
var q = require('q');
var prependFile = require('prepend-file');


var mainWindow = null;
var settingsWindow = null;
var enduroProcess = null;

app.on("ready", function () {
	loadSplash();
	startEnduro();
	setTimeout(function () {
		tryConnect();
	}, 1000);
});

function tryConnect() {
	mainWindow.hide();
	mainWindow = new BrowserWindow({
		frame: true,
		resizable: true
	});
	mainWindow.loadURL(url.format({
		pathname: __dirname + '/electronApp/index.html',
		protocol: 'file',
		slashes: true,
		webPreferences: {
			webSecurity: false
		}
	}));
}

function loadSplash() {
	mainWindow = new BrowserWindow({
		frame: false,
		height: 300,
		resizable: false,
		width: 300
	});
	mainWindow.loadURL(url.format({
		pathname: __dirname + "/electronApp/splash.html",
		protocol: 'file',
		slashes: true,
		webPreferences: {
			webSecurity: false
		}
	}));
}

function startEnduro() {
	cmd.run("enduro dev");
}

var indexDefPath = __dirname + '/cms/index.js';
var destPath = __dirname + '/assets/js/index.js';

fs.watch(indexDefPath, function (curr, prev) {
	copyIndexDef()
		.then(assignCopyIndexDef)
		.then(tryConnect)
		.catch(e => {
			console.log(e);
		});

});

function copyIndexDef() {
	var copyIndexDefDeferred = q.defer();
	fsExtra.copy(indexDefPath, destPath, err => {
		if (err) {
			console.error(err);
			copyIndexDefDeferred.reject(err);
			return;
		}
		console.log('success!');
		copyIndexDefDeferred.resolve();
	});
	return copyIndexDefDeferred.promise;
}

function assignCopyIndexDef() {
	var prefix = 'var content = ';
	var assignCopyIndexDef = q.defer();
	prependFile(destPath, prefix, err => {
		if (err) {
			console.error(err);
			assignCopyIndexDef.reject(err);
			return;
		}
		console.log('success!');
		assignCopyIndexDef.resolve();
	});
	return assignCopyIndexDef.promise;
}
