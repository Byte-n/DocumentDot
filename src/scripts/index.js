import DocumentDot from "./DocumentDot";
import ColorTools from "./ColorTools";


(function () {
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
  console.log(hsla)


  window.documentDot = new DocumentDot({
    canvas: canvas,
    callback: {
      callback(_d) {
        documentDot.emitDot("1.", "2..", "3...", "文档粒子")
      },
      callbackType: 'forever',
      delay: 0
    },
    openingAnimation: false,
    dotConfig: {
      // color:'red',
      color(_mode, _dot) {
        // switch (_mode) {
        //   case "fill":
            return hsla.increasingColor(0.2);
        //     return _dot.index % 2 !== 0 ? 'red' : 'block';
        //   case "stroke":
        //   return 'red';
        // }
      },
      // color:{
      //   fill:'red',
      //   stroke:'block'
      // },
      // color:{
      //   fill(d){
      //     return hsla.increasingColor();
      //   },
      //   stroke(d){
      //     return hsla.getRelativelyColor();
      //   },
      // },
      mode: 'fill-stroke',
      r: 3,
      cache: true,
      initDotMode:'angle'
    }
  }, "");
//string | function('stroke'|'fill',Dot):string | {fill: string | function(Dot):string,stroke: string | function(Dot):string }
  documentDot.animation();
})();



