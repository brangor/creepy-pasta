const AUDIO_DIR = "assets/sounds/";

const SCREAM_COUNT = 19;
const SCREAM_DIR = AUDIO_DIR + "screams/";

const AMBIANCE_COUNT = 14;
const AMBIANCE_DIR = AUDIO_DIR + "soundtracks/";

const CACKLE_COUNT = 2;
const CACKLE_DIR = AUDIO_DIR + "laughs/";

var cackles = shuffle([...Array(CACKLE_COUNT).keys()].map(i => new Audio(CACKLE_DIR + (i + 1) + ".mp3")));
var screams = shuffle([...Array(SCREAM_COUNT).keys()].map(i => new Audio(SCREAM_DIR + (i + 1) + ".mp3")));
var ambiances = shuffle([...Array(AMBIANCE_COUNT).keys()].map(i => AMBIANCE_DIR + (i + 1) + ".mp3"));

let audioContext = null;
let ambianceSource = null;
let ambianceGain = null;
let ambianceStartedAt = 0;
// Bumped on every start/stop so a slow fetch for a skipped track never starts playing.
let ambianceRequest = 0;

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
// Starting or stopping at full volume clicks.
const AMBIANCE_FADE = 0.03;
// Each soundtrack's tail is crossfaded into its head at load time, so no file needs hand-made loop points.
// makeLoop prefers the longest crossfade (with head alignment) that doesn't cancel: a long blend
// smooths over the tail and head sounding different, which a short one turns into an audible swap.
const LOOP_CROSSFADES = [0.25, 0.5, 1, 2, 4];
const LOOP_ALIGN = 0.02;
const LOOP_MIN_BLEND = 0.9;
// The loop starts where the track first reaches this fraction of its median level; anything
// before plays once as an intro (track 1 opens with ~30 s of quiet, brighter material).
const LOOP_START_LEVEL = 0.8;
// The end is trimmed only where it's quieter than this fraction, since trimmed audio is never heard.
// It's there to drop hand-made fade-outs, which would otherwise dip into the crossfade.
const LOOP_QUIET_EDGE = 0.6;
// Hand-picked [start, end] seconds for tracks the level rules can't read. Track 14 is a run of swells
// ending in a climax (7.7x its median level at 34.7 s); 9.4 s and 29.5 s are the dips either side of
// its steady stretch, and looping them keeps the swells' 9–12 s spacing. A loud-ending rule can't do
// this generically: track 7 ends nearly as loud (4.5x vs 5.8x) and loops well as it is.
const LOOP_REGIONS = { [AMBIANCE_DIR + "14.mp3"]: [9.4, 29.5] };

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
  stopAmbiance();
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

function stopAmbiance() {
  ambianceRequest++;
  if (ambianceSource) {
    const now = audioContext.currentTime;
    ambianceGain.gain.cancelScheduledValues(now);
    ambianceGain.gain.setValueAtTime(ambianceGain.gain.value, now);
    ambianceGain.gain.linearRampToValueAtTime(0, now + AMBIANCE_FADE);
    ambianceSource.stop(now + AMBIANCE_FADE);
    ambianceSource = null;
  }
}

// Rebuilds a decoded track as an intro that plays once plus a seamless loop: picks the loop start and
// end from the level, then crossfades the end into the loop start. The crossfade also buries the
// MP3's own edges, which never encode cleanly, at near-zero gain.
// Returns { buffer, loopStart }; play it with loop = true and loopStart, looping to the buffer's end.
// region, [start, end] in seconds, replaces the level-based choice of loop start and end.
function makeLoop(buffer, region) {
  const rate = buffer.sampleRate;
  const channels = [...Array(buffer.numberOfChannels).keys()].map(c => buffer.getChannelData(c));

  const step = Math.round(rate * 0.05);
  const levels = [];
  for (let i = 0; i + step <= buffer.length; i += step) {
    let sum = 0;
    for (const data of channels) for (let j = i; j < i + step; j++) sum += data[j] * data[j];
    levels.push(Math.sqrt(sum / (step * channels.length)));
  }
  // Judged on a one-second running level, so one loud blip inside a fade or intro doesn't end it early.
  const smoothed = levels.map((_, i) => {
    const near = levels.slice(Math.max(0, i - 10), i + 11);
    return near.reduce((a, b) => a + b) / near.length;
  });
  const median = [...levels].sort((a, b) => a - b)[levels.length >> 1];
  const start = region
    ? Math.round(region[0] * rate)
    : smoothed.findIndex(level => level >= median * LOOP_START_LEVEL) * step;
  const end = region
    ? Math.round(region[1] * rate)
    : (smoothed.findLastIndex(level => level >= median * LOOP_QUIET_EDGE) + 1) * step;

  const maxFade = Math.min(Math.round(rate * Math.max(...LOOP_CROSSFADES)), Math.floor((end - start) / 4));
  const align = Math.round(rate * LOOP_ALIGN);
  const mono = (from, to) => {
    const out = new Float32Array(to - from);
    for (const data of channels) for (let i = from; i < to; i++) out[i - from] += data[i] / channels.length;
    return out;
  };
  const head = mono(start, start + align + maxFade);
  const tail = mono(end - maxFade, end);

  // Equal-power crossfades assume the tail and head are uncorrelated; where they're out of phase the
  // mix dips below what either gives alone. Score each option by its worst 50 ms against that level.
  let best = { score: -Infinity }, longestClean = null;
  for (const seconds of LOOP_CROSSFADES) {
    const fade = Math.min(Math.round(rate * seconds), maxFade);
    const tailAt = maxFade - fade;

    // ~4k samples estimate the match well enough; every sample of a 4 s fade took half a second.
    const stride = Math.max(4, Math.round(fade / 4096));
    let shift = 0, bestMatch = -Infinity;
    for (let s = 0; s <= align; s++) {
      let match = 0;
      for (let k = 0; k < fade; k += stride) match += tail[tailAt + k] * head[s + k];
      if (match > bestMatch) { bestMatch = match; shift = s; }
    }

    let score = Infinity;
    for (let k = 0; k + step <= fade; k += step) {
      let mixed = 0, alone = 0;
      for (let j = k; j < k + step; j++) {
        const t = (j + 0.5) / fade * Math.PI / 2;
        const out = tail[tailAt + j] * Math.cos(t), into = head[shift + j] * Math.sin(t);
        mixed += (out + into) ** 2;
        alone += out * out + into * into;
      }
      score = Math.min(score, Math.sqrt(mixed / alone));
    }
    if (score > best.score) best = { score, fade, shift };
    if (score >= LOOP_MIN_BLEND && fade > (longestClean?.fade ?? 0)) longestClean = { score, fade, shift };
  }

  // The buffer runs from the file's start to the loop end; its last `fade` samples blend the end into
  // the loop start, then playback wraps to just after that blend, where the audio continues as recorded.
  const { fade, shift } = longestClean || best, from = start + shift;
  const loop = new AudioBuffer({ numberOfChannels: channels.length, length: end, sampleRate: rate });
  channels.forEach((data, c) => {
    const out = loop.getChannelData(c);
    out.set(data.subarray(0, end - fade));
    for (let k = 0; k < fade; k++) {
      const t = (k + 0.5) / fade * Math.PI / 2;
      out[end - fade + k] = data[end - fade + k] * Math.cos(t) + data[from + k] * Math.sin(t);
    }
  });
  return { buffer: loop, loopStart: (from + fade) / rate };
}

// <audio loop> and seeking back on timeupdate both leave an audible seam;
// a looping AudioBufferSourceNode wraps sample-accurately.
// secondsBeforeLoop starts playback that far before the loop point, so the seam can be auditioned.
// boostDb raises a quiet track using the headroom under MAX_AMBIANCE_VOLUME, capped so its loudest
// sample stays below full scale: plain gain, unlike baking loudness into the file, which forces a
// limiter (it flattened track 12's peaks and distorted track 14's ending). Resolves to the boost applied.
async function playAmbiance(url, secondsBeforeLoop = 0, boostDb = 0) {
  stopAmbiance();
  const request = ambianceRequest;
  // iOS suspends Web Audio when the screen locks unless the page holds a playback audio session
  // (honoured from iOS 17.5, WebKit bug 261554); it also stops the silent switch muting it.
  if (navigator.audioSession) navigator.audioSession.type = "playback";
  audioContext = audioContext || new AudioContext();
  audioContext.resume();

  const response = await fetch(url);
  const { buffer, loopStart } = makeLoop(await audioContext.decodeAudioData(await response.arrayBuffer()), LOOP_REGIONS[url]);
  if (request !== ambianceRequest) return;

  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    for (const sample of buffer.getChannelData(c)) peak = Math.max(peak, Math.abs(sample));
  }
  const volume = Math.min(MAX_AMBIANCE_VOLUME * 10 ** (boostDb / 20), Math.max(MAX_AMBIANCE_VOLUME, 0.99 / peak));

  const now = audioContext.currentTime;
  ambianceGain = audioContext.createGain();
  ambianceGain.gain.setValueAtTime(0, now);
  ambianceGain.gain.linearRampToValueAtTime(volume, now + AMBIANCE_FADE);
  ambianceGain.connect(audioContext.destination);

  ambianceSource = audioContext.createBufferSource();
  ambianceSource.buffer = buffer;
  ambianceSource.loop = true;
  ambianceSource.loopStart = loopStart;
  ambianceSource.loopEnd = buffer.duration;
  ambianceSource.connect(ambianceGain);
  const offset = secondsBeforeLoop ? Math.max(0, buffer.duration - secondsBeforeLoop) : 0;
  ambianceSource.start(now, offset);
  ambianceStartedAt = now - offset;
  return 20 * Math.log10(volume / MAX_AMBIANCE_VOLUME);
}

// A looping buffer source has no currentTime of its own, so position is derived from the context clock.
// loops is 0 during the intro, then counts passes through the loop.
function ambiancePosition() {
  if (!ambianceSource) return null;
  const { loopStart, loopEnd: duration } = ambianceSource;
  const elapsed = audioContext.currentTime - ambianceStartedAt;
  if (elapsed < loopStart) return { position: elapsed, duration, loops: 0 };
  const loopLength = duration - loopStart;
  return {
    position: loopStart + (elapsed - loopStart) % loopLength,
    duration,
    loops: Math.floor((elapsed - loopStart) / loopLength) + 1,
  };
}
