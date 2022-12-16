"use strict";
/* global app */
/* global shor2 */

function ToolZone(editor) {
  this.editor = editor;
  
  this.element = document.getElementById("editor-tool-zone");
  
  this.valId = document.getElementById("editor-tool-zone-id");
  this.valColor = document.getElementById("editor-tool-zone-color");
  this.valMusic = document.getElementById("editor-tool-zone-music");
  
  this.valInitialX = document.getElementById("editor-tool-zone-initial-x");
  this.valInitialY = document.getElementById("editor-tool-zone-initial-y");

  this.valWidth = document.getElementById("editor-tool-zone-width");
  this.valHeight = document.getElementById("editor-tool-zone-height");
  
  var tmp = this;
  this.btnApply = document.getElementById("editor-tool-zone-apply");
  this.btnApply.onclick = function() { tmp.reload(); };
  
  this.btnSize = document.getElementById("editor-tool-zone-resize");
  this.btnSize.onclick = function() { tmp.resize(); };
  
  this.btnShiftX = document.getElementById("editor-tool-zone-shiftx");
  this.btnShiftX.onclick = function() { tmp.shiftX(); };
  this.btnUnshiftX = document.getElementById("editor-tool-zone-unshiftx");
  this.btnUnshiftX.onclick = function() { tmp.unshiftX(); };
  this.btnShiftY = document.getElementById("editor-tool-zone-shifty");
  this.btnShiftY.onclick = function() { tmp.shiftY(); };
  this.btnUnshiftY = document.getElementById("editor-tool-zone-unshifty");
  this.btnUnshiftY.onclick = function() { tmp.unshiftY(); };
}

ToolZone.prototype.resize = function() {
  var W = parseInt(this.valWidth.value);
  var H = parseInt(this.valHeight.value);
  
  var dat = this.zone.data;
  
  var w = dat[0].length;
  var h = dat.length;
  
  var rs = [];
  for(var i=0;i<H;i++) {
    rs.push([]);
    for(var j=0;j<W;j++) {
      if(i < h && j < w) { rs[i][j] = dat[i][j]; }
      else { rs[i][j] = [30,0,0,0,0]; }
    }
  }
  
  this.editor.dirty = true;
  this.zone.data = rs;
};

ToolZone.prototype.shiftX = function() {
  var dat = this.zone.data;
  var obj = this.zone.obj;
  var wrp = this.zone.warp;
  var spn = this.zone.spawnpoint;
  
  for(var i=0;i<dat.length;i++) {
    dat[i].shift();
  }
  
  for(var i=0;i<obj.length;i++) {
    var pos = shor2.decode(obj[i].pos);
    pos.x--;
    obj[i].pos = shor2.encode(pos.x, pos.y);
  }
  
  for(var i=0;i<wrp.length;i++) {
    var pos = shor2.decode(wrp[i].pos);
    pos.x--;
    wrp[i].pos = shor2.encode(pos.x, pos.y);
  }

  for (var i=0;i<spn.length;i++) {
    var pos = shor2.decode(spn[i].pos);
    pos.x--;
    spn[i].pos = shor2.encode(pos.x, pos.y);
  }
};

ToolZone.prototype.unshiftX = function() {
  var dat = this.zone.data;
  var obj = this.zone.obj;
  var wrp = this.zone.warp;
  var spn = this.zone.spawnpoint;
  
  for(var i=0;i<dat.length;i++) {
    dat[i].unshift([30,0,0,0,0]);
  }
  
  for(var i=0;i<obj.length;i++) {
    var pos = shor2.decode(obj[i].pos);
    pos.x++;
    obj[i].pos = shor2.encode(pos.x, pos.y);
  }
  
  for(var i=0;i<wrp.length;i++) {
    var pos = shor2.decode(wrp[i].pos);
    pos.x++;
    wrp[i].pos = shor2.encode(pos.x, pos.y);
  }

  for(var i=0;i<spn.length;i++) {
    var pos = shor2.decode(spn[i].pos);
    pos.x++;
    spn[i].pos = shor2.encode(pos.x, pos.y);
  }
};

ToolZone.prototype.shiftY = function() {
  var dat = this.zone.data;
  dat.shift();
};

ToolZone.prototype.unshiftY = function() {
  var dat = this.zone.data;
  
  var nu = [];
  for(var i=0;i<dat[0].length;i++) {
    nu.push(30);
  }
  
  dat.unshift(nu);
};

ToolZone.prototype.reload = function() {
  this.save();
  this.load();
};

ToolZone.prototype.load = function() {
  this.zone = this.editor.currentZone;
  var pos = shor2.decode(this.zone.initial);
  
  this.valId.value = this.zone.id;
  this.valInitialX.value = pos.x;
  this.valInitialY.value = pos.y;
  this.valColor.value = this.zone.color;
  this.valMusic.value = this.zone.music;
  this.valWidth.value = this.zone.data[0].length;
  this.valHeight.value = this.zone.data.length;
  
  this.element.style.display = "block";
};

ToolZone.prototype.save = function() {
  try {
    var i = parseInt(this.valId.value);
    var x = parseInt(this.valInitialX.value);
    var y = parseInt(this.valInitialY.value);
    if(isNaN(i) || isNaN(x) || isNaN(y)) { throw "oof"; }
    this.zone.id = i;
    this.zone.initial = shor2.encode(x, y);
    this.zone.color = this.valColor.value;
    this.zone.music = this.valMusic.value;
  }
  catch(ex) { app.menu.warn.show("Failed to parse value. Changes not applied."); }
  
  app.menu.list.generate();
};

ToolZone.prototype.destroy = function() {
  this.element.style.display = "none";
  this.save();
};