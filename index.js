AUDIO_DIR = "assets/sounds/";

SCREAM_COUNT = 24;
SCREAM_DIR = AUDIO_DIR + "screams/";

AMBIANCE_COUNT = 14;
AMBIANCE_DIR = AUDIO_DIR + "soundtracks/";

screams = [...Array(SCREAM_COUNT).keys()].map(i => new Audio(SCREAM_DIR + (i + 1) + ".wav"));
ambiances = [...Array(AMBIANCE_COUNT).keys()].map(i => new Audio(AMBIANCE_DIR + (i + 1) + ".wav"));

current_scream_id = -1;
current_ambiance_id = -1;

function getRandomInt(max, lastValue) {
  var randomInt = Math.floor(Math.random() * Math.floor(max)) + 1;
  while (randomInt === lastValue) {
    randomInt = Math.floor(Math.random() * Math.floor(max)) + 1;
  }
  return randomInt;
}

function stopClip(clip) {
  if (clip)
  {
    clip.pause();
    clip.currentTime = 0
  }
}

function playScreamClip() {
  stopClip(screams[current_scream_id]);

  current_scream_id = getRandomInt(SCREAM_COUNT, current_scream_id);

  screams[current_scream_id].play();
};

function nextAmbiance() {
  stopClip(ambiances[current_ambiance_id]);

  current_ambiance_id = getRandomInt(AMBIANCE_COUNT, current_ambiance_id);

  ambiances[current_ambiance_id].play();
};
