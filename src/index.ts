import { getPixelColor, setMouseDelay, setKeyboardDelay} from "robotjs";
import {
  Region,
  screen as nutScreen,
  keyboard,
  mouse,
  Point,
  Button
} from "@nut-tree/nut-js";
//process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1";
import * as cv from '@u4/opencv4nodejs';

import fs from "fs";
import { Worker, createWorker } from "tesseract.js";


const processScreenshot = (path: string): Array<Buffer> => {
  const img = cv.imread(path);
  const grayImg = img.cvtColor(cv.COLOR_BGR2GRAY);
  const blackAndWhite = grayImg.threshold(0, 255, cv.THRESH_OTSU + cv.THRESH_BINARY);

  var cnts = blackAndWhite.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  for (let i = 0; i < cnts.length; i++) {
    const cnt = cnts[i];
    const rect = cnt.boundingRect();
    if (rect.width < 10 || rect.height < 10) {
      cnts.splice(i, 1);
      i--;
    }
  }

  cnts = cnts.sort((cnt1, cnt2) => {
    const rect1 = cnt1.boundingRect();
    const rect2 = cnt2.boundingRect();
    return rect1.x - rect2.x;
  });

  const canvasSize = 74; // Set the desired canvas size
  const spaceTopBottom = 10; // Set the desired space at the top and bottom
  const buffArray: Array<Buffer> = [];
  for (let i = 0; i < cnts.length; i++) {
    const cnt = cnts[i];
    const rect = cnt.boundingRect();
    const cropped = blackAndWhite.getRegion(rect);

    // Create a new canvas for each iteration
    const canvas = cv.Mat.zeros(canvasSize + 2 * spaceTopBottom, canvasSize, cv.CV_8UC1);

    // Calculate the position to paste the letter in the center with space at the top and bottom
    const pasteX = Math.floor((canvasSize - cropped.cols) / 2);
    const pasteY = spaceTopBottom;

    // Get the region of interest in the canvas
    const roi = canvas.getRegion(new cv.Rect(pasteX, pasteY, cropped.cols, cropped.rows));

    // Copy the letter to the center of the canvas with space at the top and bottom
    cropped.copyTo(roi);

    buffArray.push(cv.imencode('.png', canvas));

    //cv.imwrite(`./cropped/cropped${i}.png`, canvas);
  }
  return buffArray;
};


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const checkAlignment = async (worker: Worker) => {
  if (getPixelColor(741, 724) !== "e6e8f4") {
    console.log("Screen no longer aligned");
    await worker.terminate();
    process.exit(0);
  }
};

const waitForStart = async (x: number, y: number) => {
  while (getPixelColor(x, y) === "ffffff") {
    await sleep(10);
  }
};

const readScreen = async (x: number, y: number, width: number, height: number) => {
  fs.readdirSync("./cropped").forEach((file) => {
    fs.unlinkSync(`./cropped/${file}`);
  });

  while (getPixelColor(898, 571) === "ffd154") {
    await sleep(100);
  }
  const region = new Region(x, y, width, height);
  await nutScreen.captureRegion(`./nbr.png`, region);
};

const recognizeNumber = async (worker: Worker) => {

  const buffArray = processScreenshot(`./nbr.png`);
  let str = "";
  for (let i = 0; i < buffArray.length; i++) {
    const ret = await worker.recognize(buffArray[i]);
    str = str.concat(ret.data.text.replace('\n', ''));
  }

  return parseInt(str);
};

const typeAndSubmit = async (number: number) => {
  while (getPixelColor(892, 512) !== "ffd154") {
    await sleep(10);
  }
  await keyboard.type(number.toString());
  const point = new Point(892, 540);
  await mouse.setPosition(point);
  await mouse.click(Button.LEFT);
};

const goToNext = async () => {
  while (getPixelColor(898, 571) !== "ffd154") {
    await sleep(10);
  }
  const point = new Point(898, 571);
  await mouse.setPosition(point);
  await mouse.click(Button.LEFT);
};

(async () => {
  setMouseDelay(0);
  setKeyboardDelay(0);
  keyboard.config.autoDelayMs = 0;
  const x = 460;
  const y = 335;
  const width = 1440 - x;
  const height = 575 - y;
  var number = 0;
  var written = false;
  var screenRead = false;

  const worker = await createWorker("digits");
  await worker.setParameters({ tessedit_char_whitelist: '0123456789' });

  fs.readdirSync("./cropped").forEach((file) => {
    fs.unlinkSync(`./cropped/${file}`);
  });

  console.log("Ready to start");
  await waitForStart(701, 424);

  while (true) {
    await checkAlignment(worker);

    if (!screenRead) {
      console.log("Before Reading screen")
      await readScreen(x, y, width, height);
      screenRead = true;
    } else if (number === 0 && screenRead) {
      console.log("Before recognizeNumber");
      number = await recognizeNumber(worker);
      console.log(number);
    } else if (number > 0 && !written) {
      console.log("Before typeAndSubmit");
      await typeAndSubmit(number);
      written = true;
    } else if (written) {
      console.log("Before goToNext");
      await goToNext();
      number = 0;
      screenRead = false;
      written = false;
    }

    await sleep(100);
  }
})();







// (async () => {
//     const worker = await createWorker("digits");
//     await worker.setParameters({ tessedit_char_whitelist: '0123456789' });

//     const test = await recognizeNumber(worker);
//     console.log(test)

//   const worker2 = await createWorker("eng");
//   await worker.setParameters({ tessedit_char_whitelist: '0123456789' });

//   const test2 = await recognizeNumber(worker);
//   console.log(test2)
// })();