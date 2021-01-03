AUDIO_DIR = "assets/sounds/";

SCREAM_COUNT = 24;
SCREAM_DIR = AUDIO_DIR + "screams/";

AMBIANCE_COUNT = 20;
AMBIANCE_DIR = AUDIO_DIR + "soundtracks/";

var screams = [...Array(SCREAM_COUNT).keys()].map(i => new Audio(SCREAM_DIR + (i + 1) + ".wav"));
var ambiances = [...Array(AMBIANCE_COUNT).keys()].map(i => new Audio(AMBIANCE_DIR + (i + 1) + ".mp3"));

let current_scream_id = -1;
let current_ambiance_id = -1;

var prefixes = ["Deadly","Death","Scarlet","Forbidden","Feral","Mourning","Destined","Hallowed","Demon","Death","Fallen","Demon","Slaves","Raven","Phantom", "Blood", "Satan", "Hell", "Thirsty", "Starving", "Corpse"];
var suffixes = ["Embrace","Craving","Mistress","Betrayal","Secret","Love","Shadow","Hunger","Wine","Gravy","Sins","Moon","Spiders","Eternal","Sorrow","Light","Lament", "Moonlight", "Dungeons", "Torturer", "Yearnings", "Decay", "Silence"];
var mixins = ["And", "Of The", "Of", "In", "With Endless", "Under The", "Betwixt The"];

let current_prefix_id = -1;
let current_suffix_id = -1;
let current_mixin_id = -1;

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

  if (Math.random() < 0.3) {
    current_mixin_id = getRandomInt(mixins.length, current_mixin_id);
    mixin = mixins[current_mixin_id] + " ";
  }

  return prefix + mixin + suffix;
}

function stopClip(clip) {
  if (clip)
  {
    clip.pause();
    clip.currentTime = 0
  }
};

function silencio() {
  stopClip(screams[current_scream_id]);
  stopClip(ambiances[current_ambiance_id]);
  document.getElementById('track-title').innerHTML = "None";
}

function playScreamClip() {
  stopClip(screams[current_scream_id]);

  current_scream_id = getRandomInt(SCREAM_COUNT, current_scream_id);

  screams[current_scream_id].play();
};

function nextAmbiance() {
  stopClip(ambiances[current_ambiance_id]);

  current_ambiance_id = getRandomInt(AMBIANCE_COUNT, current_ambiance_id);

  playAmbiance(ambiances[current_ambiance_id]);

  changeTitle();
};

function changeTitle() {
  document.getElementById('track-title').innerHTML = getRandomTitle();
}

function playAmbiance(audio) {
  audio.addEventListener('timeupdate', function(){
      var buffer = .75
      if(this.currentTime > this.duration - buffer){
          this.currentTime = 0.3
          this.play()
      }
  });

  audio.volume = 0.7;
  audio.loop = true;

  audio.play();
}
