import DocumentDot from "./DocumentDot";
import ColorTools from "./ColorTools";
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

  const hsla = ColorTools.createHSLAColorObject();
  hsla.s = '45%'
  hsla.l = '50%'
  /**
   *
   * @type {(string
   *   ||{text:string, fontSize?:number, initDotMode?:('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *   ||{imageData: ImageData, initDotMode?: ('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *  )[]}
   */
  let texts = [{
    text: "❤",
    fontSize: 9999,
    initDotMode: 'angle',
    ctxMode: 'stroke',
    color: {fill: () => '#ff7272', stroke: () => '#ff7272'}
  }];
  // texts = ["1.", "2..", "3...", "文档粒子"];
  // texts = [{text: 'A', color: {fill: () => 'red', stroke: () => 'red'}},
  //   {text: 'a', color: {fill: () => '#fff', stroke: () => '#fff'}}]
  window.documentDot = new DocumentDot({
    canvas: canvas,
    marginX: 10,
    marginY: 10,
    callback: {
      callback(_d) {
        _d.emitDot(...texts)
      },
      callbackType: 'forever',
      delay: 0
    },
    openingAnimation: false,
    dotConfig: {
      color2: {
        fill(_dot) {
          return hsla.increasingColor(0.1)
        },
        stroke(_dot) {
          return hsla.increasingColor(0.1)
        }
      },
      color: '#ff7272',
      ctxMode: 'fill-stroke',
      r: 2,
      cache: true,
      initDotMode: 'angle'
    }
  }, {text: "❤", fontSize: 9999});
  documentDot.animation();


  loadDotsFormImage('res/1.png');
  loadDotsFormImage('res/2.png');

  function loadDotsFormImage(src) {
    let image = new Image();
    image.src = src;
    image.onload = function () {
      let can = document.createElement('canvas');
      can.width = documentDot.canvas.width;
      can.height = documentDot.canvas.height;
      let ctx = can.getContext('2d');
      let c = ImageTools.contain({width: image.width, height: image.height}, {width: can.width, height: can.height});
      ctx.clearRect(0, 0, can.width, can.height);
      ctx.drawImage(image, c.dx, c.dy, c.dw, c.dh)
      imageData = ctx.getImageData(0, 0, can.width, can.height);
      texts.unshift({
        imageData,
        ctxMode: 'fill-stroke',
        color: {
          fill: (_dot) => `rgba(${_dot.rgba.r},${_dot.rgba.g},${_dot.rgba.b},${_dot.rgba.a})`,
          stroke: (_dot) => `rgba(${_dot.rgba.r},${_dot.rgba.g},${_dot.rgba.b},${_dot.rgba.a})`
        },
        initDotMode: 'round'
      })
    }
    image.onerror = function () {
      console.error('无法加载图片：', image.src)
    }
  }
})();
