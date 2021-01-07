const AUDIO_DIR = "assets/sounds/";

const SCREAM_COUNT = 19;
const SCREAM_DIR = AUDIO_DIR + "screams/";

const AMBIANCE_COUNT = 14;
const AMBIANCE_DIR = AUDIO_DIR + "soundtracks/";

const CACKLE_COUNT = 2;
const CACKLE_DIR = AUDIO_DIR + "laughs/";

var cackles = shuffle([...Array(CACKLE_COUNT).keys()].map(i => new Audio(CACKLE_DIR + (i + 1) + ".mp3")));
var screams = shuffle([...Array(SCREAM_COUNT).keys()].map(i => new Audio(SCREAM_DIR + (i + 1) + ".mp3")));
var ambiances = shuffle([...Array(AMBIANCE_COUNT).keys()].map(i => new Audio(AMBIANCE_DIR + (i + 1) + ".mp3")));

const prefixes = ["Deadly","Death","Scarlet","Forbidden","Feral","Mourning","Destined","Hallowed","Demon","Death","Fallen","Demon","Slaves","Raven","Phantom", "Blood", "Satan", "Hell", "Thirsty", "Starving", "Corpse", "Goblin"];
const suffixes = ["Embrace","Craving","Mistress","Betrayal","Secret","Love","Shadow","Hunger","Wine","Gravy","Sins","Moon","Spiders","Eternal","Sorrow","Light","Lament", "Moonlight", "Dungeons", "Torturer", "Yearnings", "Decay", "Silence", "Embers", "Rot"];
const mixins = ["And", "Of The", "Of", "In", "With Endless", "Under The", "Betwixt The"];

let current_cackle_id = -1;
let current_scream_id = -1;
let current_ambiance_id = -1;

let current_prefix_id = -1;
let current_suffix_id = -1;
let current_mixin_id = -1;

const MIXIN_CHANCE = 0.3;

const MAX_AMBIANCE_VOLUME = 0.7;

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
  if (clip)
  {
    clip.pause();
    clip.currentTime = 0;
  }
};

function silencio() {
  stopClip(screams[current_scream_id]);
  stopClip(ambiances[current_ambiance_id]);
  stopClip(cackles[current_cackle_id]);
  document.getElementById('track-title').innerHTML = "None";
}

function cackler() {
  stopClip(cackles[current_cackle_id]);
  current_cackle_id = getRandomInt(CACKLE_COUNT, current_cackle_id);
  cackles[current_cackle_id].play();
}

function playScreamClip() {
  stopClip(screams[current_scream_id]);

  current_scream_id = getRandomInt(SCREAM_COUNT, current_scream_id);

  screams[current_scream_id].play();
};

function nextAmbiance() {
  stopClip(ambiances[current_ambiance_id]);

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
      var buffer = 0.5;
      if(this.currentTime > this.duration - buffer){
          this.currentTime = 0;
          this.play();
      }
  });

  audio.volume = MAX_AMBIANCE_VOLUME;
  audio.loop = true;

  audio.play();
}
