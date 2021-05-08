import DocumentDot from "./DocumentDot";


$(function () {
    let canvas = $(`<canvas width="${window.innerWidth}" height="${window.innerHeight}"></canvas>`)
        .css({
            position: "fixed",
            top: 0,
            left: 0
        });
    document.body.append(canvas[0])
    const documentDot = new DocumentDot({
            canvas: canvas,
            callback: {
                callback: function () {
                    f();
                },
                callbackType: 'for ever',
                delay: 2000
            },
            enableInitializationAnimation: true
        }, "文档", "文档粒子", "粒子")

    documentDot.animation();


    function f() {
        documentDot.emitDot("文档", "文档粒子", "粒子")
    }
})



