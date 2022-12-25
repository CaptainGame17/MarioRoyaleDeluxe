"use strict";
/* global app */
/* global util */

function StateGame() {
  this.pingOut = false;
  this.pingLast = 0;
  this.pingFrame = 90;
};

StateGame.prototype.handlePacket = function(packet) {
  switch(packet.type) {
    case "g01" : { this.load(packet); return true; }
    case "g06" : { this.globalWarn(packet); return true; }
    case "g21" : { this.recievePing(packet); return true; }
    default : { return app.ingame() ? app.game.handlePacket(packet) : false; }
  }
};

StateGame.prototype.handleBinary = function(data) {
  if(app.ingame()) { app.game.handleBinary(data); }
};

StateGame.prototype.ready = function() {
  this.send({type: "g00"});
};

// G01
StateGame.prototype.load = function(p) {  
  var address = window.location.host;
  var that = this;

  if (app.ingame() && app.game.worldSelected && app.net.prefLobby && !app.game.customLevelData) {
    $.ajax({
      url: window.location.protocol + "//" + address + "/royale/game/" + app.game.worldSelected,
      type: 'GET',
      timeout: 5000,
      success: function(data) {
        app.load(data);
        that.send({type: "g03"});
      },
      error: function() {
        app.menu.error.show("Server returned FNF(404) for game file: " + app.game.worldSelected);
      }
    });
    return;
  }

  if (app.ingame() && app.game.customLevelData && app.net.prefLobby) {
    app.load(app.game.customLevelData);
    that.send({type: "g03"});
    return;
  }
  
  $.ajax({
    url: window.location.protocol + "//" + address + "/royale/game/" + p.game,
    type: 'GET',
    timeout: 5000,
    success: function(data) {
      app.load(data);
      that.send({type: "g03"});
    },
    error: function() {
      app.menu.error.show("Server returned FNF(404) for game file: " + p.game);
    }
  });
};

// G06
StateGame.prototype.globalWarn = function(p) {
  app.menu.warn.show(p.message);
};

StateGame.prototype.sendPing = function() {
  var now = util.time.now();
  
  if(this.pingOut && this.pingLast - now < 999) { return; }
  else if(this.pingOut) { app.net.ping = 999; }
  
  this.send({type: "g21", delta: now});
  
  this.pingOut = now;
  this.pingOut = true;
};

// G21
StateGame.prototype.recievePing = function(p) {
  var now = util.time.now();
  app.net.ping = now - p.delta;
  this.pingOut = false;
};

StateGame.prototype.send = function(data) {
  app.net.send(data);
};

StateGame.prototype.type = function() {
  return "g";
};

StateGame.prototype.destroy = function() {
  
};