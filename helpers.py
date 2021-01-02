import random

def wav_list(count, folder_name):
  return list(map(lambda n: "assets/sounds/" + folder_name + "/" + str(n) + ".wav", range(1, count + 1)))

def random_sound(sound_list):
  return sound_list[random.randint(1, len(sound_list))]
