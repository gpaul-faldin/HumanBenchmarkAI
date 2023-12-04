import jimp from "jimp";
import { Region, screen, mouse, Point, keyboard } from "@nut-tree/nut-js";
import dotenv from "dotenv";
import { createWorker } from "tesseract.js";
dotenv.config();

import fs from "fs";

(async () => {
  const region = new Region(
    Number(process.env.X),
    Number(process.env.Y),
    950,
    140
  );
  await screen.captureRegion("screenshot.png", region);

  const worker = await createWorker("eng");
  const ret = await worker.recognize("./screenshot.png");
  var parsedStr = ret.data.text.replace(/\n/g, " ");
  parsedStr = parsedStr.replace(/\|/g, "I");
  await worker.terminate();

  fs.writeFileSync("output.txt", parsedStr);

  const point = new Point(Number(process.env.X), Number(process.env.Y));

  await mouse.setPosition(point);
  await mouse.leftClick();

  keyboard.config.autoDelayMs = 1;

  // const parsedStrArr = parsedStr.split("");
  // for (let i = 0; i < parsedStrArr.length; i++) {
  //   console.log(parsedStrArr[i]);
  //   await keyboard.type(parsedStrArr[i]);
  // }
  await keyboard.type(parsedStr);
})();
