import DocumentDot from "./DocumentDot";
// import ColorTools from "./ColorTools";
import ImageTools from "./ImageTools";


(function () {
  let imageData;
  let canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'

  document.body.append(canvas)

  // const hsla = ColorTools.createHSLAColorObject();
  // hsla.s = '45%'
  // hsla.l = '50%'

  window.documentDot = new DocumentDot({
    canvas: canvas,
    marginX: 10,
    marginY: 10,
    callback: {
      callback(_d) {
        if (imageData) {
          documentDot.emitDot({imageData, r: 2}, {text: "❤", fontSize: 9999})
          return
        }
        documentDot.emitDot("1.", "2..", "3...", "文档粒子")
      },
      callbackType: 'forever',
      delay: 0
    },
    openingAnimation: true,
    dotConfig: {
      color:{
        fill:'#fff',
        stroke:'#e7e7e7'
      },
      // color(_mode, _dot) {
      //   if (hsla.speed > 50) {
      //     hsla.speed = 0;
      //   }
      //   hsla.speed = Math.random() * 50
      //   return  hsla.increasingColor(0);
      //   // return Math.random() < 0.5 ?
      //   //   hsla.getRelativelyColor() : hsla.increasingColor(0.2);
      // },
      ctxMode: 'fill-stroke',
      r: 2,
      cache: true,
      initDotMode: 'angle'
    }
  },  {text: "❤", fontSize: 9999});

  let can = document.createElement('canvas');
  can.width = documentDot.canvas.width;
  can.height = documentDot.canvas.height;
  let ctx = can.getContext('2d');

  let image = new Image();
  image.src = 'res/1.png'
  image.onload = function () {
    let c = ImageTools.contain({width: image.width, height: image.height}, {width: can.width, height: can.height});
    ctx.drawImage(image, c.dx, c.dy, c.dw, c.dh)
    imageData = ctx.getImageData(0, 0, can.width, can.height);
  }
  documentDot.animation();
})();
// 壁纸 ############################################################################################


