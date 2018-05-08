"use strict";

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const spawn = require("child_process");
var cmd = require("node-cmd");
const http = require("http");
const fs = require('fs');
const axios = require("axios");
const url = require('url');
var fsExtra = require('fs-extra');
var q = require('q');
var prependFile = require('prepend-file');
var chokidar = require('chokidar');
var _ = require('lodash');

var mainWindow = null;
var settingsWindow = null;
var enduroProcess = null;

var indexDefPath = __dirname + '/cms/index.js';
var destPath = __dirname + '/assets/js/index.js';
var newsPath = __dirname + '/cms/generators/news';
var pagePath = __dirname + '/cms/generators/page';

app.on("ready", function () {
	loadSplash();
	startEnduro();
	setTimeout(function () {
		tryConnect();
	}, 1000);
});

var newsWatcher = chokidar.watch(newsPath);
var pagesWatcher = chokidar.watch(pagePath);

newsWatcher.on('add', updateNewsPaths)
	.on('unlink', updateNewsPaths);

pagesWatcher.on('add', updatePagesPaths)
	.on('unlink', updatePagesPaths);

fs.watch(indexDefPath, function (curr, prev) {
	copyIndexDef()
		.then(assignCopyIndexDef)
		.then(tryConnect)
		.catch(e => {
			console.log(e);
		});
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

function updateNewsPaths(param) {
	fs.readdir(newsPath, (err, files) => {
		var navPath = __dirname + '/cms/global/newsNav.js';
		var navs = {};
		navs.newsLinks =  getNewsPaths(files);
		var fileContent = `(${JSON.stringify(navs)})`;
		fs.writeFile(navPath, fileContent, (err) => {
			if (err) throw err;
			console.log('The file has been saved!');
		});
	})
}

function updatePagesPaths(param) {
	fs.readdir(pagePath, (err, files) => {
		var navPath = __dirname + '/cms/global/pageNav.js';
		fs.writeFile(navPath, getPagesPaths(files), (err) => {
			if (err) throw err;
			console.log('The file has been saved!');
		});
	})
}

function getNewsPaths(files) {
	var links = [];
	_.forEach(files, function (file) {
		if (file === 'news.js') {
			return;
		}
		var path = './news/' + file;
		var name = `${file.split('.')[0]}(${path})`;
		var item = {};
		item[name] = path;
		links.push(item);
	});
	return links;
}

function getPagesPaths(files) {
	var result = {
		pageLinks: []
	};
	_.forEach(files, function (file) {
		if (file === 'page.js') {
			return;
		}
		var fileName = file.split('.')[0];
		var path = `./${fileName}.html`;
		var name = `${fileName}(${path})`;
		var item = {};
		item[name] = path;
		result.pageLinks.push(item);
	});
	return `(${JSON.stringify(result)})`;
}

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
