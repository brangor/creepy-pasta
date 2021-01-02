import simpleaudio as sa
import helpers
import random
import time

SCREAM_COUNT = 24
AMBIANCE_COUNT = 14

screams = helpers.wav_list(SCREAM_COUNT, "screams")
ambiances = helpers.wav_list(AMBIANCE_COUNT, "soundtracks")

"<audio src=\"" + "\" type=\"audio/wav\" />"

for x in range(len(screams)):
  print(screams[x])

for x in range(len(ambiances)):
  print(ambiances[x])

ambiance = helpers.random_sound(ambiances)

ambiance_wave = sa.WaveObject.from_wave_file(ambiance)

scream = helpers.random_sound(screams)
scream_wave = sa.WaveObject.from_wave_file(scream)

play_ambiance = ambiance_wave.play()

time.sleep(2)
play_scream = scream_wave.play()

while(play_ambiance.is_playing()):
  play_scream.wait_done()
  time.sleep(2)

  scream = helpers.random_sound(screams)
  scream_wave = sa.WaveObject.from_wave_file(scream)
  play_scream = scream_wave.play()

play_ambiance.wait_done()


# scream_wave_obj = sa.WaveObject.from_wave_file(scream)

# play_scream_obj = scream_wave_obj.play()

# play_scream_obj.wait_done()
