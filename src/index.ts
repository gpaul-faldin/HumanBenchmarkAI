import { mouseClick, setMouseDelay, moveMouse, screen } from 'robotjs';
process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1";
import * as cv from '@u4/opencv4nodejs';
import {createWorker} from 'tesseract.js';

const RectangleCenter = 41;


async function highlightSquares(image: cv.Mat): Promise<cv.Mat | any> {
  // Convert the image to grayscale
  const gray = image.cvtColor(cv.COLOR_BGR2GRAY);

  // Apply GaussianBlur to reduce noise and help with contour detection
  const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);

  // Use Canny edge detector to find edges in the image
  const edges = blurred.canny(35, 50);

  const contours = edges.findContours(cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  const squares = []

  for(let x = 0; x < contours.length; x++) {
    if (contours[x].area === 6309) {
      const rect = contours[x].boundingRect();
      const point1 = new cv.Point2(rect.x, rect.y);
      const point2 = new cv.Point2(rect.x + rect.width, rect.y + rect.height);
      image.drawRectangle(point1, point2, new cv.Vec3(0, 255, 0), 2);

      const charRegion = image.getRegion(rect);
      const charRegionGray = charRegion.cvtColor(cv.COLOR_BGR2GRAY);

      const buff = cv.imencode('.png', charRegionGray);
      const worker = await createWorker("eng")
      worker.setParameters({tessedit_char_whitelist: '0123456789'})
      const ret = await worker.recognize(buff)
      await worker.terminate()
      squares.push({ x: rect.x, y: rect.y, num: ret.data.text ? Number(ret.data.text) : 3 });
    }
    else if (contours[x].area === 6603) {
      const rect = contours[x].boundingRect();
      const point1 = new cv.Point2(rect.x, rect.y);
      const point2 = new cv.Point2(rect.x + rect.width, rect.y + rect.height);
      image.drawRectangle(point1, point2, new cv.Vec3(0, 255, 0), 2);
      squares.push({ x: rect.x, y: rect.y, num: -1 });
    }
    else if (contours[x].area === 6606) {
      const rect = contours[x].boundingRect();
      const point1 = new cv.Point2(rect.x, rect.y);
      const point2 = new cv.Point2(rect.x + rect.width, rect.y + rect.height);
      image.drawRectangle(point1, point2, new cv.Vec3(0, 255, 0), 2);
      squares.push({ x: rect.x, y: rect.y, num: -1 });
    }
    else if (contours[x].area === 6305) {
      squares.push({ x: -2, y: -2, num: -2 });
      return squares;
    }
  }
 

  return squares;
}

async function processFrame(screenCapture: cv.Mat): Promise<[{
  x: number,
  y: number,
  num: number
}]> {

  if (!screenCapture.empty) {
    // Highlight squares in the frame
    const result = await highlightSquares(screenCapture);
    if (result.length === 0) {
      return [{ x: 0, y: 0, num: 0 }];
    }
    return result;
  }
  return [{ x: 0, y: 0, num: 0 }];
}

(async () => {
  var prevRes = [{ x: -1, y: -1, num: -1 }];
  setMouseDelay(0);

  const x = 500;
  const y = 210;
  const width = 900;
  const height = 455;

  while (true) {
    const img = screen.capture(x, y, width, height);

    const mat = new cv.Mat(height, width, cv.CV_8UC4);
    const buf = Buffer.from(img.image);
    mat.setData(buf);
    const res = await processFrame(mat);
    res.sort((a, b) => a.num - b.num);
    if (res[0].x !== -2 && res[0].y !== -2 && res[0].num !== -2) {
      if (JSON.stringify(prevRes) !== JSON.stringify(res)) {
        prevRes = res;

        if (res[0].x === 0 && res[0].y === 0 && res[0].num === 0) {
          cv.imwrite('./images/result.jpg', mat);
          process.exit(0);
        }


        for (let x = 0; x < res.length; x++) {
          moveMouse(res[x].x + 500 + RectangleCenter, res[x].y + 210 + RectangleCenter);
          mouseClick();
        }
        moveMouse(300, 400);
      }
    }
    // Add a pause of 1 second (1000 milliseconds) after the for loop
    await new Promise(resolve => setTimeout(resolve, 1));
  }
})();
