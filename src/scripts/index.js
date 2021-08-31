import DocumentDot from "./DocumentDot";


$(function () {
  let canvas = $(`<canvas width="${window.innerWidth}" height="${window.innerHeight}"></canvas>`)
    .css({
      position: "fixed",
      top: 0,
      left: 0
    });
  document.body.append(canvas[0])

  window.documentDot = new DocumentDot({
    canvas: canvas[0],
    callback: {
      callback: function () {
        documentDot.emitDot("文档", "文档粒子", '粒子')
      },
      callbackType: 'for ever',
      delay: 0
    },
    openingAnimation: false,
    dotConfig: {
      color: '#fff',
      mode: 'stroke',
      r: 5
    }
  }, "")
  documentDot.animation();


})



