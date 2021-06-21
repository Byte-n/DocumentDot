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
    canvas: canvas,
    callback: {
      callback: function () {
        documentDot.emitDot("文档", "文档粒子", '粒子')
      },
      callbackType: 'for ever',
      delay: 0
    },
    enableInitializationAnimation: true,
    dotConfig: {
      color: '#fff8f8',
      mode: 'fill'
    }
  }, "")

  documentDot.animation();


})



