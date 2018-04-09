"use strict";

var app = require("app");
var BrowserWindow = require("browser-window");
var globalShortcut = require("global-shortcut");
var configuration = require("./configuration");
const spawn = require("child_process");
var ipc = require("ipc");
var cmd = require("node-cmd");
const http = require("http");
var request = require('request');

var mainWindow = null;
var settingsWindow = null;
var enduroProcess = null;

app.on("ready", function() {
  if (!configuration.readSettings("shortcutKeys")) {
    configuration.saveSettings("shortcutKeys", ["ctrl", "shift"]);
  }

  startEnduro();
  tryConnect();

  setGlobalShortcuts();
});

function tryConnect() {
  http.get({
	hostname: 'localhost',
	port: 5000,
	path: '/',
	agent: false  // create a new agent just for this one request
  }, function(res) {
	  console.log(res);
  });

    mainWindow = new BrowserWindow({
      frame: true,
      height: 700,
      resizable: true,
      width: 1000
    });

    mainWindow.loadUrl("localhost:5000");
}

function setGlobalShortcuts() {
  globalShortcut.unregisterAll();

  var shortcutKeysSetting = configuration.readSettings("shortcutKeys");
  var shortcutPrefix =
    shortcutKeysSetting.length === 0 ? "" : shortcutKeysSetting.join("+") + "+";

  globalShortcut.register(shortcutPrefix + "1", function() {
    mainWindow.webContents.send("global-shortcut", 0);
  });
  globalShortcut.register(shortcutPrefix + "2", function() {
    mainWindow.webContents.send("global-shortcut", 1);
  });
}

function startEnduro() {
  cmd.run("enduro dev");
}

ipc.on("close-main-window", function() {
  app.quit();
});

ipc.on("open-settings-window", function() {
  if (settingsWindow) {
    return;
  }

  settingsWindow = new BrowserWindow({
    frame: false,
    height: 200,
    resizable: false,
    width: 200
  });

  settingsWindow.loadUrl("file://" + __dirname + "/app/settings.html");

  settingsWindow.on("closed", function() {
    settingsWindow = null;
  });
});

ipc.on("close-settings-window", function() {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

ipc.on("set-global-shortcuts", function() {
  setGlobalShortcuts();
});
