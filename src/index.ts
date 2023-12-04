import { mouseClick, setMouseDelay, moveMouse, screen } from 'robotjs';
process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1"
import * as cv from '@u4/opencv4nodejs';

function processImage(img: cv.Mat): number[] {

  //const regionImg = img.getRegion(region);
  const grayImg = img.cvtColor(cv.COLOR_BGR2GRAY);
  const circles = grayImg.houghCircles(
    cv.HOUGH_GRADIENT, 1, 20, 20, 45, 20, 80
  );

  if (circles && circles.length > 0) {
    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i];
      const x = circle.x;
      const y = circle.y;
      const centralPixelColor = grayImg.at(y, x);

      if (centralPixelColor > 120) {
       return [x, y];
      } else if (centralPixelColor === 116) {
      return [-1, -1];
      }
      else {
        return [-2, -2];
      }
    }
  }
  return [-1, -1];
}

function processVideo() {
  const delay = 3;
  var lastX = 0;
  var lastY = 0;

  setMouseDelay(0);

  setInterval(async () => {
    const img = screen.capture(535, 222, 900, 450);

    const mat = new cv.Mat(450, 900, cv.CV_8UC4);
    const buf = Buffer.from(img.image);
    mat.setData(buf);
    const result = processImage(mat);
    const [x, y] = result || [];

    if (x !== -1 && y !== -1 && (Math.abs(x - lastX) > 2.5 || Math.abs(y - lastY) > 2.5) && (x !== lastX || y !== lastY)) {
      if (x !== -2 && y !== -2) {
        moveMouse(x + 535, y + 222);
        lastX = x;
        lastY = y;
        mouseClick();
      }
    }

    if (x === -1 && y === -1) {
      console.log('Exiting process');
      process.exit(0);
    }
  }, delay);
}

// Start the main loop
processVideo();