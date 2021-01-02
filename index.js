AUDIO_DIR = "assets/sounds/";

SCREAM_COUNT = 24;
SCREAM_DIR = AUDIO_DIR + "screams/";

AMBIANCE_COUNT = 14;
AMBIANCE_DIR = AUDIO_DIR + "soundtracks/";

screams = [...Array(SCREAM_COUNT).keys()].map(i => new Audio(SCREAM_DIR + (i + 1) + ".wav"));
ambiances = [...Array(AMBIANCE_COUNT).keys()].map(i => new Audio(AMBIANCE_DIR + (i + 1) + ".wav"));

current_scream_id = -1;
current_ambiance_id = -1;

var prefixes = ["Deadly","Death","Scarlet","Forbidden","Feral","Mourning","Destined","Hallowed","Demon","Death","Fallen","Demon","Slaves","Raven","Phantom", "Blood"];
var suffixes = ["Embrace","Craving","Mistress","Betrayal","Secret","Love","Shadow","Hunger","Wine","Gravy","Sins","Moon","Spiders","Eternal","Sorrow","Light","Lament", "Moonlight"];
var mixins = ["and", "of the", "of", "in", "with endless", "under the"];

function getRandomInt(max, lastValue = -1) {
  var randomInt = Math.floor(Math.random() * Math.floor(max));
  while (randomInt === lastValue) {
    randomInt = Math.floor(Math.random() * Math.floor(max));
  }
  return randomInt;
}

function getRandomTitle() {
  var prefix = prefixes[getRandomInt(prefixes.length)] + " ";
  var suffix = suffixes[getRandomInt(suffixes.length)];

  var mixin = "";

  var hasMixin = Math.random() > 0.7;
  if (hasMixin) {
    mixin = mixins[getRandomInt(mixins.length)] + " ";
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
  document.getElementById('track-title').innerHTML = "None playing";
}

function playScreamClip() {
  stopClip(screams[current_scream_id]);

  current_scream_id = getRandomInt(SCREAM_COUNT, current_scream_id);

  screams[current_scream_id].play();
};

function nextAmbiance() {
  stopClip(ambiances[current_ambiance_id]);

  current_ambiance_id = getRandomInt(AMBIANCE_COUNT, current_ambiance_id);

  changeTitle();

  ambiances[current_ambiance_id].play();
};

function changeTitle() {
  document.getElementById('track-title').innerHTML = getRandomTitle();
}
