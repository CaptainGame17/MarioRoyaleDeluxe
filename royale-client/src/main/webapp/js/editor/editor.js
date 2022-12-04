"use strict";
/* global app */
/* global util, shor2, vec2, td32 */
/* global Function, requestAnimFrameFunc, cancelAnimFrameFunc */
/* global Display, GameObject */


function Editor(data) {
  this.middle = document.getElementById("editor-middle");
  
  this.container = document.getElementById("editor-display");
  this.canvas = document.getElementById("editor-display-canvas");
  
  this.input = new Input(this, this.canvas);
  this.display = new EditorDisplay(this, this.container, this.canvas, data.resource);
  
  this.load(data);
  
  this.frame = 0;
  this.delta = util.time.now();
  
  this.dataRaw = data; // kept on hand for compile()
  
  this.showRef = false;
  this.offsetRef = vec2.make(0, 0);
  this.reference = undefined;
  
  this.dirty = false; // don't let the user leave if true

  var that = this;
  this.frameReq = requestAnimFrameFunc.call(window, function() { that.draw(); }); // Javascript 🙄
};

Editor.TICK_RATE = 1000/120;

Editor.prototype.load = function(data) {  
  /* Load world data */
  this.world = new World(this, data);

  var def = document.getElementById("editor-tool-tile-def");
  var type = document.getElementById("editor-tool-object-type");

  for (var td of Object.keys(td32.TILE_PROPERTIES)) {
    var tile = td32.TILE_PROPERTIES[td];

    var elem = document.createElement("option");
    elem.value = td;
    elem.innerText = td + " - " + tile.NAME;
    def.appendChild(elem);
  }

  var objs = [];
  for (var obj of GameObject.OBJECT_LIST) { objs.push(obj.ID) };
  objs.sort((a, b) => { return a-b });

  for (var obj of objs) {
    var elem = document.createElement("option");
    elem.value = obj;
    elem.innerText = obj + " - " + GameObject.OBJECT(obj).NAME;

    type.appendChild(elem);
  }
  
  this.ready = true;
};

Editor.prototype.compile = function() {
  /* Have to do it this way for production sdk to still work */
  var data = {};
  data.type = this.dataRaw.type;
  data.resource = this.dataRaw.resource;
  data.initial = this.world.initial;
  data.assets = this.dataRaw.assets
  data.mode = this.dataRaw.mode;
  data.world = [];
  
  for(var i=0;i<this.world.levels.length;i++) {
    var level = this.world.levels[i];
    
    var ldat = {};
    ldat.id = level.id;
    ldat.name = level.name;
    ldat.initial = level.initial;
    ldat.zone = [];
    
    for(var j=0;j<level.zones.length;j++) {
      var zone = level.zones[j];
      
      var zdat = {};
      zdat.id = zone.id;
      zdat.initial = zone.initial;
      zdat.color = zone.color;
      zdat.music = zone.music;
      zdat.data = zone.data;
      zdat.obj = zone.obj;
      zdat.warp = zone.warp;
      zdat.bg = zone.bg;
      zdat.bgs = zone.bgs;
      
      ldat.zone.push(zdat);
    }
    data.world.push(ldat);
  }
  
  return JSON.stringify(data);
};

Editor.prototype.setTool = function(tool) {
  if(this.tool) { this.tool.destroy(); }
  
  switch(tool) {
    case "world" : { this.tool = new ToolWorld(this); this.tool.load(); break; }
    case "level" : { this.tool = new ToolLevel(this); this.tool.load(); break; }
    case "zone" : { this.tool = new ToolZone(this); this.tool.load(); break; }
    case "tile" : { this.tool = new ToolTile(this); this.tool.load(); break; }
    case "object" : { this.tool = new ToolObject(this); this.tool.load(); break; }
    case "warp" : { this.tool = new ToolWarp(this); this.tool.load(); break; }
    case "copy" : { this.tool = new ToolCopy(this); this.tool.load(); break; }
    case "rep" : { this.tool = new ToolRep(this); this.tool.load(); break; }
    case "bg" : { this.tool = new ToolBackground(this); this.tool.load(); break; }
    case "ref" : { this.tool = new ToolRef(this); this.tool.load(); break; }
  }
};

/* Handle player input */
Editor.prototype.doInput = function() {
  var imp = this.input.pop();
//  
//  if(!this.inx27 && this.input.keyboard.keys[27]) { /* MENU */ } this.inx27 = this.input.keyboard.keys[27]; // ESC
//  
//  var obj = this.getPlayer();
//  if(!obj) { return; }
//  
  var mous = this.input.mouse;
  var keys = this.input.keyboard.keys;
  
  if(this.tool && this.tool.input) { this.tool.input(imp, mous, keys); }
  
  if(mous.rmb) { this.display.camera.move(vec2.make(mous.mov.x,-mous.mov.y)); }
  if(mous.spin) { this.display.camera.zoom(mous.spin); }
  
  if(keys[71] && !this.inx71) { this.showRef = !this.showRef; this.inx71 = true; } this.inx71 = keys[71]; // G -> Toggle Ref
};

/* Step game world */
Editor.prototype.doStep = function() {  
  
  /* Step world to update bumps & effects & etc */
  //this.world.step();
  
};

/* Changes to specifed zone  */
Editor.prototype.setZone = function(zone) {
  this.currentZone = zone;
  if(this.tool) { this.tool.reload(); }
  var dim = zone.dimensions();
  this.display.camera.position(vec2.scale(dim, .5));
};

/* Returns the zone we are editing. */
Editor.prototype.getZone = function() {
  if(!this.currentZone) { this.setZone(this.world.getInitialZone()); }
  return this.currentZone;
};

Editor.prototype.draw = function() {
  if(this.ready) {
    var now = util.time.now();
    if((now - this.delta) / Editor.TICK_RATE > 0.75) {      
      this.doInput();
      this.doStep();
      this.display.draw();
      
      this.frame++;
      this.delta = now;
    }
  }
  
  var that = this;
  this.frameReq = requestAnimFrameFunc.call(window, function() { that.draw(); }); // Javascript 🙄
};

Editor.prototype.destroy = function() {
  cancelAnimFrameFunc.call(window, this.frameReq);
};