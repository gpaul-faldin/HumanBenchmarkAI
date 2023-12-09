import { getPixelColor, setMouseDelay, setKeyboardDelay} from "robotjs";
import {
  Region,
  screen as nutScreen,
  keyboard,
  mouse,
  Point,
  Button
} from "@nut-tree/nut-js";
process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1";
import * as cv from '@u4/opencv4nodejs';

import fs from "fs";
import { createWorker } from "tesseract.js";


const processScreenshot = (path: string): boolean => {
  const img = cv.imread(path);
  const grayImg = img.cvtColor(cv.COLOR_BGR2GRAY);
  const blackAndWhite = grayImg.threshold(0, 255, cv.THRESH_OTSU + cv.THRESH_BINARY);
  var cnts = blackAndWhite.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  cnts = cnts.sort((cnt1, cnt2) => {
    const rect1 = cnt1.boundingRect();
    const rect2 = cnt2.boundingRect();
    return rect1.x - rect2.x;
  });

  const canvasSize = 74; // Set the desired canvas size
  const spaceTopBottom = 10; // Set the desired space at the top and bottom
  for (let i = 0; i < cnts.length; i++) {
    const cnt = cnts[i];
    const rect = cnt.boundingRect();
    const cropped = blackAndWhite.getRegion(rect);

    // Create a black canvas with space at the top and bottom
    const canvas = cv.Mat.zeros(canvasSize + 2 * spaceTopBottom, canvasSize, cv.CV_8UC1);

    // Calculate the position to paste the letter in the center with space at the top and bottom
    const pasteX = Math.floor((canvasSize - cropped.cols) / 2);
    const pasteY = spaceTopBottom;

    // Get the region of interest in the canvas
    const roi = canvas.getRegion(new cv.Rect(pasteX, pasteY, cropped.cols, cropped.rows));

    // Copy the letter to the center of the canvas with space at the top and bottom
    cropped.copyTo(roi);

    cv.imwrite(`./cropped/cropped${i}.png`, canvas);

  }

  return true;
};

(async () => {
  setMouseDelay(0);
  setKeyboardDelay(0);
  keyboard.config.autoDelayMs = 0;
  const x = 460;
  const y = 365;
  const width = 1440 - x;
  const height = 485 - y;
  var number = 0;
  var written = false;
  var screenRead = false;

  const worker = await createWorker("digits");

  //902, 567 FFD154 // START
  //460, 385 // TOP LEFT
  //1440, 485 //BOT RIGHT
  //892, 512 FFD154 // SUBMIT
  //898, 571 FFD154 //NEXT

  console.log("Ready to start")

  while (true) {
    if (getPixelColor(741, 724) !== "e6e8f4") {
      console.log("Screen no longer alligned");
      await worker.terminate();
      process.exit(0);
    }
    while (getPixelColor(701, 424) === "ffffff") {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (!screenRead) {
      console.log("reading screen")
      while (getPixelColor(898, 571) === "ffd154") {
        console.log("Waiting for screen");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      console.log("reading screen past while")
      const region = new Region(x, y, width, height);
      await nutScreen.captureRegion(`./nbr.png`, region);
      screenRead = true;
    } else if (number === 0 && screenRead) {
      await worker.setParameters({tessedit_char_whitelist: '0123456789'});
      processScreenshot(`./nbr.png`);
      var str: string = "";
      var nbr = fs.readdirSync("./cropped").length;
      for (let i = 0; i < nbr; i++) {
        const ret = await worker.recognize(`./cropped/cropped${i}.png`);
        str = str.concat(ret.data.text.replace('\n', ''));
        fs.unlinkSync(`./cropped/cropped${i}.png`);
      }

      number = parseInt(str);
      console.log(number)
    } else if (number > 0 && !written) {
      while (getPixelColor(892, 512) !== "ffd154") {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      await keyboard.type(number.toString());
      const point = new Point(892, 540);
      await mouse.setPosition(point);
      await mouse.click(Button.LEFT);
      written = true;
    } else if (written) {
      while (getPixelColor(898, 571) !== "ffd154") {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      console.log("Next")
      const point = new Point(898, 571);
      await mouse.setPosition(point);
      await mouse.click(Button.LEFT);
      number = 0;
      screenRead = false;
      written = false;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
})();
