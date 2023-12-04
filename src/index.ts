import { mouseClick, setMouseDelay, moveMouse, getPixelColor } from 'robotjs';

(async () => {
  const x = 800;
  const y = 585;
  const knowColors = ['2b87d1', '4bdb6a', 'ffd154', 'ce2636']

  setMouseDelay(0);
  moveMouse(x, y);

  while (true) {
    const color = getPixelColor(x, y);
    if (color === 'ffd154' || !knowColors.includes(color)) {
      console.log('end of game');
      process.exit(0);
    }
    if (color === '2b87d1' || color === '4bdb6a')
      mouseClick();
    await new Promise(resolve => setTimeout(resolve, 1));
  }
})();
