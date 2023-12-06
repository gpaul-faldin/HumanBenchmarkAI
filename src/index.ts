import { mouseClick, setMouseDelay, moveMouse, screen, getPixelColor, Bitmap } from 'robotjs';
process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1";
import * as cv from '@u4/opencv4nodejs';

function captureNumberOfSquares(image: cv.Mat): [Array<{x: number, y: number}>, number] {
  const gray = image.cvtColor(cv.COLOR_BGR2GRAY);
  const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);
  const edges = blurred.canny(35, 50);
  const contours = edges.findContours(cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  var rectangleCount = 0;
  const rectangle = [];

  // console.log(contours)

  for (let i = 0; i < contours.length; i++) {
    if (contours[i].area === 13375 || contours[i].area === 7530 || contours[i].area === 5010 || contours[i].area === 3232 || contours[i].area === 2483) {
      const rect = contours[i].boundingRect();
      const point1 = new cv.Point2(rect.x, rect.y);
      const point2 = new cv.Point2(rect.x + rect.width, rect.y + rect.height);
      image.drawRectangle(point1, point2, new cv.Vec3(125, 255, 0), 2);
      rectangle.push({x: rect.x, y: rect.y});
      rectangleCount++;
    }
  }
  if (rectangleCount > 0)
    return [rectangle, rectangleCount];
  else
    return [[{x: 0, y: 0}], 0];
}

function isDuplicate(array: Array<{ x: number, y: number }>, rectangle: { x: number, y: number }): boolean {
  for (let i = 0; i < array.length; i++) {
    if (array[i].x === rectangle.x && array[i].y === rectangle.y) {
      return true; // Duplicate found
    }
  }
  return false; // No duplicate found
}

(async () => {
  setMouseDelay(0);
  const x = 700;
  const y = 250;
  const width = 500;
  const height = 455;
  var numberToFind = 3;
  var color = false;
  var rectangles: Array<{ x: number, y: number }> = [];
  var rectangleCount = 0;
  var rectanglesToClick: Array<{ x: number, y: number }> = [];
  var img: Bitmap;


  while (true){
    if (getPixelColor(665, 737) !== 'e6e8f4') {
      console.log("Screen no longer alligned")
      process.exit(0);
    }
    if (color === false) {
      img = screen.capture(x, y, width, height);
      const mat = new cv.Mat(height, width, cv.CV_8UC4);
      const buf = Buffer.from(img.image);
      let counter = 0;
      for (let i = 0; i < width; i++) {
        let color = img.colorAt(i, 60);
        if (color === '2573c1') {
          counter++;
          while (color === '2573c1') {
            i++;
            color = img.colorAt(i, 60);
          }
        }
      }
      mat.setData(buf);
      [rectangles, rectangleCount] = captureNumberOfSquares(mat);
      if (rectangleCount === counter * counter && counter !== 0) {
        color = true;
      }
    } else {
      if (rectanglesToClick.length <= numberToFind) {
        for (let i = 0; i < rectangleCount; i++) {
          let currentRectangle = { x: x + rectangles[i].x + 25, y: y + rectangles[i].y + 25 };

          if (!isDuplicate(rectanglesToClick, currentRectangle)) {
            if (getPixelColor(currentRectangle.x, currentRectangle.y) === 'ffffff') {
              rectanglesToClick.push(currentRectangle);
            }
          }
        }
      }


      if (rectanglesToClick.length === numberToFind) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        for (let i = 0; i < rectanglesToClick.length; i++) {
          moveMouse(rectanglesToClick[i].x, rectanglesToClick[i].y);
          mouseClick();
        }
        moveMouse(574, 500);
        color = false;
        rectanglesToClick = [];
        numberToFind++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

})();
