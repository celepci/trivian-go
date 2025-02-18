import { Howl } from 'howler';

const sounds = {
  dice: new Howl({
    src: ['/sounds/dice.mp3'],
    volume: 0.5
  }),
  correct: new Howl({
    src: ['/sounds/correct.mp3'],
    volume: 0.5
  }),
  wrong: new Howl({
    src: ['/sounds/wrong.mp3'],
    volume: 0.5
  }),
  win: new Howl({
    src: ['/sounds/win.mp3'],
    volume: 0.7
  })
};

export const playSound = (soundName: keyof typeof sounds) => {
  sounds[soundName].play();
};

export const stopSound = (soundName: keyof typeof sounds) => {
  sounds[soundName].stop();
};
