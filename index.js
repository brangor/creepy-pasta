const DEBUG_MODE = true;
const AUDIO_DIR = "assets/sounds/";

const SCREAM_COUNT = 24;
const SCREAM_DIR = AUDIO_DIR + "screams/";

const AMBIANCE_COUNT = 20;
const AMBIANCE_DIR = AUDIO_DIR + "soundtracks/";

var screams = [...Array(SCREAM_COUNT).keys()].map(i => new Audio(SCREAM_DIR + (i + 1) + ".wav"));
var ambiances = shuffle([...Array(AMBIANCE_COUNT).keys()].map(i => new Audio(AMBIANCE_DIR + (i + 1) + ".mp3")));

const prefixes = ["Deadly","Death","Scarlet","Forbidden","Feral","Mourning","Destined","Hallowed","Demon","Death","Fallen","Demon","Slaves","Raven","Phantom", "Blood", "Satan", "Hell", "Thirsty", "Starving", "Corpse"];
const suffixes = ["Embrace","Craving","Mistress","Betrayal","Secret","Love","Shadow","Hunger","Wine","Gravy","Sins","Moon","Spiders","Eternal","Sorrow","Light","Lament", "Moonlight", "Dungeons", "Torturer", "Yearnings", "Decay", "Silence"];
const mixins = ["And", "Of The", "Of", "In", "With Endless", "Under The", "Betwixt The"];

let current_scream_id = -1;
let current_ambiance_id = -1;

let current_prefix_id = -1;
let current_suffix_id = -1;
let current_mixin_id = -1;

const MIXIN_CHANCE = 0.3;

const MAX_AMBIANCE_VOLUME = 0.7;
const CROSSFADE_STEPS = 4;
const CROSSFADE_DURATION = 1;

function debug(message) {
  if (DEBUG_MODE === true)
  {
    console.log(message);
  }
}

function getRandomInt(max, lastValue = -1) {
  var randomInt = Math.floor(Math.random() * Math.floor(max));
  while (randomInt === lastValue) {
    randomInt = Math.floor(Math.random() * Math.floor(max));
  }
  return randomInt;
}

function getRandomTitle() {
  current_prefix_id = getRandomInt(prefixes.length, current_prefix_id);
  current_suffix_id = getRandomInt(suffixes.length, current_suffix_id);

  var prefix = prefixes[current_prefix_id] + " ";
  var suffix = suffixes[current_suffix_id];

  var mixin = "";

  if (Math.random() < MIXIN_CHANCE) {
    current_mixin_id = getRandomInt(mixins.length, current_mixin_id);
    mixin = mixins[current_mixin_id] + " ";
  }

  return prefix + mixin + suffix;
}

function stopClip(clip) {
  if (clip && !clip.paused)
  {
    clip.pause();
    clip.currentTime = 0;
    debug("Stopping audio:");
    audioInfo(clip, false);
  }
};

function silencio() {
  stopClip(screams[current_scream_id]);

  stopClip(ambiances[current_ambiance_id]);
  stopClip(buffer_track);

  document.getElementById('track-title').innerHTML = "None";
}

function updateGains ( audio, volume ) {
  audio.volume = volume;
  debug(`Audio volume now ${volume}`);
}

function audioInfo (audio, duration = true) {
  let fileBits = audio.src.split('/');
  let name = fileBits[fileBits.length - 1];
  let type = fileBits[fileBits.length - 2];
  debug(`\tAudio file: ${type}/${name}`);
  if (duration)
  {
    debug(`\tDuration: ${audio.duration} seconds`);
  }
}

function playScreamClip() {
  stopClip(screams[current_scream_id]);

  current_scream_id = getRandomInt(SCREAM_COUNT, current_scream_id);

  var scream = screams[current_scream_id];
  scream.play();

  debug(`Scream playing:`);
  audioInfo(scream, false);

  scream.addEventListener('ended', function(){
    debug(`Scream finished:`);
    audioInfo(this);
  });
};

function nextAmbiance() {
  stopClip(ambiances[current_ambiance_id]);

  current_ambiance_id = current_ambiance_id + 1;

  if (++current_ambiance_id > (ambiances.length - 1)) {
    ambiances = shuffle(ambiances);
    current_ambiance_id = 0;
  }

  playAmbiance(ambiances[current_ambiance_id]);

  changeTitle();
};

function shuffle(list) {
  return list.sort(() => Math.random() - 0.5);
}

function changeTitle() {
  document.getElementById('track-title').innerHTML = getRandomTitle();
}

function playAmbiance(audio) {
  audio.addEventListener('timeupdate', function(){
    var buffer = .5
    if(this.currentTime > this.duration - buffer){
      var buffer_track = this.cloneNode();
      playAmbiance(buffer_track);
      audioVolumeOut(this);
      stopClip(this);
      ambiances[current_ambiance_id] = buffer_track;
    }
  });

  updateGains(audio, MAX_AMBIANCE_VOLUME);

  audio.play();
  debug(`Playing new ambiance:`);
  audioInfo(audio);
}

function audioVolumeIn(q){
  if(q.volume){
     var InT = 0;
     var setVolume = MAX_AMBIANCE_VOLUME; // Target volume level for new song
     var speed = 0.05; // Rate of increase
     updateGains(q, InT);
     var eAudio = setInterval(function(){
         InT += speed;
         updateGains(q, InT.toFixed(1));
         if(InT.toFixed(1) >= setVolume){
            clearInterval(eAudio);
            //alert('clearInterval eAudio'+ InT.toFixed(1));
         };
     },50);
  };
};

function audioVolumeOut(q){
  if(q.volume){
     var InT = q.volume;
     var setVolume = 0;  // Target volume level for old song
     var speed = 0.05;  // Rate of volume decrease
     updateGains(q, InT);
     var fAudio = setInterval(function(){
         InT -= speed;
         updateGains(q, InT.toFixed(1));
         if(InT.toFixed(1) <= setVolume){
            clearInterval(fAudio);
            //alert('clearInterval fAudio'+ InT.toFixed(1));
         };
     },50);
  };
};
