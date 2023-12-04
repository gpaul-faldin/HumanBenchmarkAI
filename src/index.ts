import { mouseClick, setMouseDelay, moveMouse, screen } from 'robotjs';
process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1";
import * as cv from '@u4/opencv4nodejs';
import { createWorker } from 'tesseract.js';

const LevelRegion = new cv.Rect(350, 0, 200, 50);
const RectangleCenter = 41;

async function captureColorChanges(image: cv.Mat): Promise<any> {
  const gray = image.cvtColor(cv.COLOR_BGR2GRAY);
  const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);
  const edges = blurred.canny(35, 50);
  const contours = edges.findContours(cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  for (let x = 0; x < contours.length; x++) {
    if (contours[x].area > 13300 && contours[x].area < 13500){
      const rect = contours[x].boundingRect();

      const squareRegion = image.getRegion(rect);
      const averageColor = squareRegion.mean();

      if (averageColor.x > 200 && averageColor.y > 200 && averageColor.z > 200){
        return  { x: rect.x, y: rect.y } ;
      }
    }
  }

  return { x: 0, y: 0};
}

async function highlightSquares(image: cv.Mat): Promise<cv.Mat | any> {

  const Level = image.getRegion(LevelRegion);
  const LevelGray = Level.cvtColor(cv.COLOR_BGR2GRAY);
  const buff = cv.imencode('.png', LevelGray);
  const worker = await createWorker("eng")
  const ret = await worker.recognize(buff)
  await worker.terminate()

  const level = Number(ret.data.text.split('Level: ')[1]);
  if (isNaN(level)) {
    const LevelGray = image.cvtColor(cv.COLOR_BGR2GRAY);
    const buff = cv.imencode('.png', LevelGray);
    const worker = await createWorker("eng")
    const ret = await worker.recognize(buff)
    await worker.terminate()
    if (ret.data.text.includes("Sequence Memory Test")){
      return { level: 0 };
    }
  }

  return { level: level };
}

async function processFrame(screenCapture: cv.Mat): Promise<any> {

  if (!screenCapture.empty) {
    // Highlight squares in the frame
    const result = await highlightSquares(screenCapture);
    return result;
  }
  return [{ x: 0, y: 0, num: 0 }];
}


(async () => {
  const x = 500;
  const y = 210;
  const width = 900;
  const height = 455;
  var level = 0;
  var i = 0;
  var histoPointer = 0;
  var clicked = false;
  var previousColorChanges = { x: -1, y: -1 };
  const history: Array<{x: number, y:number}> = [];

  setMouseDelay(0);

  while (true) {
    const img = screen.capture(x, y, width, height);
    const mat = new cv.Mat(height, width, cv.CV_8UC4);
    const buf = Buffer.from(img.image);
    mat.setData(buf);

    if (history.length < level) {
      const res = await captureColorChanges(mat);

      if (res.x !== 0 && res.y !== 0) {
        if (res.x !== previousColorChanges.x || res.y !== previousColorChanges.y) {
          previousColorChanges = { x: res.x, y: res.y };

          if (!history[histoPointer]) {
              history.push(previousColorChanges);
              i++;
          } else if (JSON.stringify(history[histoPointer]) === JSON.stringify(previousColorChanges)) {
            histoPointer++;
          }
        }
      }
    } else {
      if (!clicked) {
        await new Promise(resolve => setTimeout(resolve, 500));
        for (let x = 0; x < history.length; x++) {
          moveMouse(history[x].x + 500 + RectangleCenter, history[x].y + 210 + RectangleCenter)
          mouseClick();
        }
        moveMouse(300, 400)
        clicked = true;
      }
    }

    const levelInfo = await processFrame(mat);

    if (levelInfo.level !== level) {
      level = levelInfo.level;
      i = 0;
      histoPointer = 0;
      previousColorChanges = { x: -1, y: -1 };
      clicked = false;
    }

    if (isNaN(levelInfo.level)) {
      console.log(history)
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 5));
  }
})();
