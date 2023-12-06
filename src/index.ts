import { mouseClick, setMouseDelay, moveMouse, screen, getPixelColor, Bitmap, getMousePos } from 'robotjs';
process.env.OPENCV4NODEJS_DISABLE_EXTERNAL_MEM_TRACKING = "1";
import * as cv from '@u4/opencv4nodejs';

function isWhitePresent(mat: cv.Mat): boolean {
  // Convert the image to grayscale
  const grayMat = mat.cvtColor(cv.COLOR_BGR2GRAY);

  // Threshold the image to create a binary mask
  const thresholdValue = 200; // Adjust this threshold value based on your needs
  const binaryMat = grayMat.threshold(thresholdValue, 255, cv.THRESH_BINARY);

  // Check if white pixels are present in the binary image
  const whitePresent = cv.countNonZero(binaryMat) > 0;

  return whitePresent;
}

function isDuplicate(array: Array<{ x: number, y: number }>, rectangle: { x: number, y: number }): boolean {
  for (let i = 0; i < array.length; i++) {
    if (array[i].x === rectangle.x && array[i].y === rectangle.y) {
      return true; // Duplicate found
    }
  }
  return false; // No duplicate found
}

function createSquaresMatrice(img: Bitmap, width: number, rectangles: Array<Array<{ x: number, y: number }>>) {

  let counter = 0;
  let space = 0;
  let size = 0;
  let start = 0;

  for (let i = 1; i < width; i++) {
    let color = img.colorAt(i, 60);
    if (color === '2573c1') {
      counter++;
      while (color === '2573c1') {
        i++;
        if (counter === 1) {
          size++;
          if (start === 0) {
            start = i;
          }
        }
        color = img.colorAt(i, 60);
      }
    } else if (color === '2b87d1' && counter === 1) {
      while (color === '2b87d1') {
        i++;
        space++;
        color = img.colorAt(i, 60);
      }
    }
  }

  for (let x = 0; x < counter; x++) {
    const columnRectangles: Array<{ x: number, y: number }> = [];
    for (let i = 0; i < counter; i++) {
      const rectX = start + i * (size + space);
      const rectY = 60 + x * (space + size);
      columnRectangles.push({ x: rectX, y: rectY });
    }
    rectangles.push(columnRectangles);
  }
  return ({ space, size, start })
  //console.log("Rectangles:", rectangles);
}

(async () => {
  setMouseDelay(0);
  const x = 700;
  const y = 250;
  const width = 500;
  const height = 455;
  var numberToFind = 3;
  var color = false;
  var rectangles: Array<Array<{ x: number, y: number }>> = [];
  var rectanglesToClick: Array<{ x: number, y: number }> = [];
  var img: Bitmap | null = null;
  var found = false;
  var info = { space: 0, size: 0, start: 0 }


  while (true) {
    if (getPixelColor(665, 737) !== 'e6e8f4') {
      console.log("Screen no longer alligned")
      process.exit(0);
    }
    if (color === false) {
      img = screen.capture(x, y, width, height);
      const mat = new cv.Mat(height, width, cv.CV_8UC4);
      const buf = Buffer.from(img.image);
      mat.setData(buf);

      if (getPixelColor(1015, 220) === 'ffffff') {
        img = screen.capture(x, y, width, height);
        while (rectangles.length === 0)
          info = createSquaresMatrice(img, width, rectangles)
        console.log(info)
        color = true;
      }
    } else if (found === false) {
      img = screen.capture(x, y, width, height);
      const mat = new cv.Mat(height, width, cv.CV_8UC4);
      const buf = Buffer.from(img.image);
      mat.setData(buf);
      found = isWhitePresent(mat)
      if (found)
        cv.imwrite('./white.png', mat);
    } else if (found === true && img) {
      console.log("White found")


      //START: X: 700 Y: 250
      //END: X: 1200 Y: 705

      for (let Y = y + 60; Y < y + height; Y += info.size + info.space) {
        for (let X = x; X < x + width; X += info.size) {
          moveMouse(X, Y);
          if (!isDuplicate(rectanglesToClick, { x: X, y: Y }) && img.colorAt(X - x, Y - y) === 'ffffff') {
            rectanglesToClick.push({ x: X, y: Y })
          }
        }
      }

      console.log("Rectangles to click:", rectanglesToClick)

      if (rectanglesToClick.length === numberToFind) {
        console.log("Clicking rectangles")
        while (getPixelColor(rectanglesToClick[0].x, rectanglesToClick[0].y) !== '2573c1') { }
        for (let i = 0; i < rectanglesToClick.length; i++) {
          moveMouse(rectanglesToClick[i].x, rectanglesToClick[i].y);
          mouseClick();
        }
        moveMouse(574, 250);
        color = false;
        rectanglesToClick = [];
        //img = null;
        found = false;
        rectangles = [];
        numberToFind++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

})();

// (async () => {
//   const x = 700;
//   const y = 250;
//   const width = 500;
//   const height = 455;
//   var rectangles: Array<Array<{ x: number, y: number }>> = [];
//   var img: Bitmap;

//   img = screen.capture(x, y, width, height);
//   let counter = 0;
//   let space = 0;
//   let size = 0;
//   let start = 0;
//   for (let i = 0; i < width; i++) {
//     let color = img.colorAt(i, 60);
//     if (color === '2573c1') {
//       counter++;
//       while (color === '2573c1') {
//         i++;
//         if (counter === 1) {
//           size++;
//           if (start === 0) {
//             start = i;
//           }
//         }
//         color = img.colorAt(i, 60);
//       }
//     } else if (color === '2b87d1' && counter === 1) {
//       while (color === '2b87d1') {
//         i++;
//         space++;
//         color = img.colorAt(i, 60);
//       }
//     }
//   }

//   for (let x = 0; x < counter; x++) {
//     const columnRectangles: Array<{ x: number, y: number }> = [];
//     for (let i = 0; i < counter; i++) {
//       const rectX = start + i * (size + space);
//       const rectY = 60 + x * (space + size);
//       columnRectangles.push({ x: rectX, y: rectY });
//     }
//     rectangles.push(columnRectangles);
//   }
//   console.log("Rectangles:", rectangles);

// })();
