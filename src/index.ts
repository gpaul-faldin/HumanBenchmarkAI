import { getPixelColor, moveMouse, mouseClick, setMouseDelay } from "robotjs";
import {
  Region,
  screen as nutScreen,
  mouse,
  Point,
  Button,
} from "@nut-tree/nut-js";

import dotenv from "dotenv";
import Jimp from "jimp";
import { createWorker } from "tesseract.js";
dotenv.config();

//425,400
//1020,505

const readScreenshot = async (path: string): Promise<string> => {
  const worker = await createWorker("eng");
  const ret = await worker.recognize(path);
  worker.terminate();
  return ret.data.text;
};

(async () => {
  setMouseDelay(0);
  const x = 425;
  const y = 420;
  const width = 575;
  const height = 80;
  var score = 0;
  mouse.config.autoDelayMs = 0;
  mouse.config.mouseSpeed = 0;

  const scoreInfo = {
    x: 700,
    y: 350,
    width: 135,
    height: 35,
  };

  const Buttons = {
    seen: {
      x: 640,
      y: 540,
    },
    new: {
      x: 780,
      y: 540,
    },
  };

  const history: Array<string> = [];
  var lastWord = "";
  var newLevel = false;

  while (true) {
    if (getPixelColor(545, 755) !== "e6e8f3") {
      console.log("Screen no longer alligned");
      console.log(history);
      process.exit(0);
    }
    if (newLevel === true && lastWord === "") {
      const scoreRegion = new Region(
        scoreInfo.x,
        scoreInfo.y,
        scoreInfo.width,
        scoreInfo.height
      );
      await nutScreen.captureRegion("./score.png", scoreRegion);
      console.log("Score: " + (await readScreenshot("./score.png")));
      const lvlStr = (await readScreenshot("./score.png")).split("Score | ")[1];
      if (Number(lvlStr) !== score) {
        score = Number(lvlStr);
        console.log("Level: " + lvlStr);
        newLevel = false;
      }
    }
    if (!newLevel) {
      newLevel = true;
      const region = new Region(x, y, width, height);
      await nutScreen.captureRegion("./screenshot.png", region);
      lastWord = await readScreenshot("./screenshot.png");
    } else if (newLevel === true && lastWord !== "") {
      if (history.includes(lastWord)) {
        let points = new Point(Buttons.seen.x, Buttons.seen.y);
        await mouse.setPosition(points).then(async () => {
          await mouse.click(Button.LEFT).then(() => {
            lastWord = "";
          });
        });
      } else {
        let points = new Point(Buttons.new.x, Buttons.new.y);
        await mouse.setPosition(points).then(async () => {
          await mouse.click(Button.LEFT).then(() => {
            history.push(lastWord);
            lastWord = "";
          });
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
})();
