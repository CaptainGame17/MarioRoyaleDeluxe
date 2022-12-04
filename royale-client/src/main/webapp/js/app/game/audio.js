"use strict";
/* global app */
/* global util, vec2, Cookies */
/* global PlayerObject */


/* Yo! This class was basically copy pasted in here from 20xx. */
/* Tbh it's fucking gross and doesn't fit the design of this engine but im out of time so hard coding it is */


/* Define Game Audio Class */
function Audio(game) {
  this.game = game;
  
  if(!this.initWebAudio()) { this.initFallback(); }
  
  this.muteMusic = parseInt(Cookies.get("music"))===1;
  this.muteSound = parseInt(Cookies.get("sound"))===1;
}

Audio.FALLOFF_MIN = 1;
Audio.FALLOFF_MAX = 24;

/* Returns true if webaudio is set up correctly, false if fuck no. */
Audio.prototype.initWebAudio = function() {
  try {
    var ACc = window.AudioContext || window.webkitAudioContext;
    this.context = new ACc();
  }
  catch(ex) {
    app.menu.warn.show("WebAudio not supported. Intializing fallback mode...");
    return false;
  }
  
  /* @TODO: ew. */
  var HARDCODED_SOUNDS = [
    "music/title1.mp3",
    "music/title2.mp3",

    "sfx/alert.mp3",
    "sfx/break.mp3",
    "sfx/breath.mp3",
    "sfx/bump.mp3",
    "sfx/coin.mp3",
    "sfx/fireball.mp3",
    "sfx/firework.mp3",
    "sfx/flagpole.mp3",
    "sfx/item.mp3",
    "sfx/jump0.mp3",
    "sfx/jump1.mp3",
    "sfx/kick.mp3",
    "sfx/life.mp3",
    "sfx/pipe.mp3",
    "sfx/powerup.mp3",
    "sfx/powerdown.mp3",
    "sfx/stomp.mp3",
    "sfx/spring.mp3",
    "sfx/vine.mp3",
    "sfx/spin.mp3",
    "sfx/message.mp3",
    "sfx/fall.mp3",
    "sfx/swim.mp3",
    
    "music/ground.mp3",
    "music/underground.mp3",
    "music/bonus.mp3",
    "music/boss.mp3",
    "music/finalboss.mp3",
    "music/water.mp3",
    "music/level.mp3",
    "music/castle.mp3",
    "music/castlewin.mp3",
    "music/victory.mp3",
    "music/star.mp3",
    "music/dead.mp3",
    "music/gameover.mp3",
    "music/battle.mp3",
    "music/hammer.mp3",
    "music/lobby.mp3",
    "music/waltuh.mp3",
    "music/ground-smb2.mp3"
  ];
  this.sounds = [];
  
  for(var i=0;i<HARDCODED_SOUNDS.length;i++) {
    if(!this.createAudio(HARDCODED_SOUNDS[i])) { return false; }
  }
  
  this.masterVolume = this.context.createGain();
  this.masterVolume.gain.value = 1.0;
  this.masterVolume.connect(this.context.destination); // Global Volume -> Speakers
  
  this.effectVolume = this.context.createGain();
  this.effectVolume.gain.value = 1.0;
  this.effectVolume.connect(this.masterVolume); // Effect Volume -> Master Volume
  
  this.musicVolume = this.context.createGain();
  this.musicVolume.gain.value = 1.0;
  this.musicVolume.connect(this.masterVolume); // Music Volume -> Master Volume
  
  this.masterVolume.gain.value = .5;
  this.effectVolume.gain.value = this.muteSound?0.:.75;
  this.musicVolume.gain.value = this.muteMusic?0.:.5;
  
  this.context.listener.setPosition(0., 0., 0.);
  this.context.listener.setOrientation(1., 0., 0., 0., 1., 0.);
  
  return true;
};

Audio.prototype.initFallback = function() {
  this.context = undefined;
  this.sounds = [];
};

/* Updates position of audio context for 3d sound */
Audio.prototype.update = function() {
  this.updateVolume();
  
  /* Set Camera Position */
  var ppos = this.game.getPlayer()?this.game.getPlayer().pos:this.game.display.camera.pos;
  if(this.context.listener.setPosition) {
    this.context.listener.setPosition(ppos.x, ppos.y, 0.);
    this.context.listener.setOrientation(1., 0., 0., 0., 1., 0.);
  }
  // Safari
  else {
    this.context.listener.positionX.value = ppos.x;
    this.context.listener.positionY.value = ppos.y;
    this.context.listener.positionZ.value = 0.;
    this.context.listener.forwardX.value = 1.;
    this.context.listener.forwardY.value = 0.;
    this.context.listener.forwardZ.value = 0.;
    this.context.listener.upX.value = 0.;
    this.context.listener.upY.value = 1.;
    this.context.listener.upZ.value = 0.;
  }
  
  /* Anti cheat snitch code */
  if(window["rylptg".split("").reverse().join("")]) { this.game.out.push(NET019.encode()); }
};

/* Set Master Volume */
Audio.prototype.updateVolume = function() {
  this.masterVolume.gain.value = .5;
  this.effectVolume.gain.value = this.muteSound?0.:.75;
  this.musicVolume.gain.value = this.muteMusic?0.:.5;
  
  if(this.muteSound || this.muteMusic) { return; }
  
  /* If a player with a star is near we lower music volume */
  var zon = this.game.getZone();
  var ppos = this.game.getPlayer()?this.game.getPlayer().pos:this.game.display.camera.pos;
  var dist = 999;
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj instanceof PlayerObject && obj.level === zon.level && obj.zone === zon.id && obj.starTimer > 0) {
      var d = vec2.distance(ppos, obj.pos);
      if(d < dist) { dist = d; }
    }
  }
  if(dist < Audio.FALLOFF_MAX) {
    this.musicVolume.gain.value = Math.max(0., Math.min(1., Math.pow(d/Audio.FALLOFF_MAX,2.)))*.5;
  }
};

Audio.prototype.saveSettings = function() {
  if (app && this.game instanceof Lobby) {
    app.menu.main.menuMusic.volume = this.muteMusic?0:0.5;
  }

  Cookies.set("music", this.muteMusic?1:0, {expires: 30});
  Cookies.set("sound", this.muteSound?1:0, {expires: 30});
};

Audio.prototype.setMusic = function(path, loop) {
  if(this.music) {
    if (!(!this.music.played && this.music.data.ready() && this.music.partialLoad)) {
      if(this.music.path === path) { return; }
      this.music.stop();
    }
  }
  this.music = this.getAudio(path, 1., 0., "music");
  this.music.loop(loop);
  this.music.play();
};

Audio.prototype.stopMusic = function() {
  if(this.music) { this.music.stop(); this.music = undefined; }
};

/* Returns boolean. True if created succesfully and false if failed to create. */
Audio.prototype.createAudio = function(path) {
  var snd = new AudioData(this.context, path);
  this.sounds.push(snd);
  return true;
};

/* Returns boolean. True if created succesfully and false if failed to create. */
Audio.prototype.createCustomAudio = function(name) {
  var snd = new CustomAudioData(this.context, name);
  this.sounds.push(snd);
  return true;
};

/* Gets the sound at the path given. If it's not already loaded it loads it. If file not found returns default sound. */
Audio.prototype.getAudio = function(path, gain, shift, type) {
  var volume;
  switch(type) {
    case "effect" : { volume = this.effectVolume; break; }
    case "music" : { volume = this.musicVolume; break; }
    default : { volume = this.effectVolume; break; }
  }
  
  for(var i=0;i<this.sounds.length;i++) {
    if(this.sounds[i].path === path) {
      return new AudioInstance(this.context, path, this.sounds[i], gain, shift, volume);
    }
  }
  
  if(this.createAudio(path)) { return this.getAudio(path); }
  
  app.menu.warn.show("Failed to load sound: '" + path + "'");
  return this.getAudio("default.mp3");
};

/* Gets the sound at the path given. If it's not already loaded it loads it. If file not found returns default sound. */
Audio.prototype.getSpatialAudio = function(path, gain, shift, type) {
  var volume;
  switch(type) {
    case "effect" : { volume = this.effectVolume; break; }
    case "music" : { volume = this.musicVolume; break; }
    default : { volume = this.effectVolume; break; }
  }
  
  for(var i=0;i<this.sounds.length;i++) {
    if(this.sounds[i].path === path) {
      return new SpatialAudioInstance(this.context, path, this.sounds[i], gain, shift, volume);
    }
  }
  
  if(this.createAudio(path)) { return this.getSpatialAudio(path); }
  
  app.menu.warn.show("Failed to load sound: '" + path + "'");
  return this.getSpatialAudio("multi/default.mp3");
};

/* Stop and unload all sounds */
Audio.prototype.destroy = function() {
  for(var i=0;i<this.sounds.length;i++) {
    this.sounds[i].destroy();
  }
  this.stopMusic();
  this.sounds = [];
  this.context.close().catch( function(ex) { console.log("Error closing audio context."); } );
};