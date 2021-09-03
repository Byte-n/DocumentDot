import DocumentDot from "./DocumentDot";


(function () {
  let canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'

  document.body.append(canvas)

  window.documentDot = new DocumentDot({
    canvas: canvas,
    callback: {
      callback(_d) {
        documentDot.emitDot("1", "文档粒子")
      },
      callbackType: 'for ever',
      delay: 0
    },
    openingAnimation: true,
    dotConfig: {
      color: '#fff',
      mode: 'fill',
      r: 2
    }
  }, "");

  documentDot.animation();
})();



