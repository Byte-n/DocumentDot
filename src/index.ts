import './css/main.less'

import DocumentDot from "./script/DocumentDot";
// @ts-ignore
import ImageTools from "./script/ImageTools";
import {CtxMode, DocumentText, DocumentTextImageData, DotInitMode, Point} from "./script/Type";

(function () {
    let imageData;

    let texts: Array<DocumentText> = [];
    texts = [{text: 'Document-Dot', fontSize: 200}, {text: 'loading...', fontSize: 200}]
    const documentDot = new DocumentDot({
        box: document.body,
        canvasCount: 4,
        width: window.innerWidth,
        height: window.innerHeight,
        marginX: 10,
        marginY: 10,
        callback: {
            callback(_d) {
                _d.emitDot(...texts)
            },
            callbackType: 'forever'
        },
        openingAnimation: false,
        dotConfig: {
            color: '#ff7272',
            ctxMode: CtxMode.Fill,
            r: 2,
            colourful: true,
            initDotMode: DotInitMode.Angle,
            pAmount: 100
        }
    }, ".") as DocumentDot;
    documentDot.animation();
    // @ts-ignore
    window.documentDot = documentDot;
    loadDotsFormImage('https://s3.bmp.ovh/imgs/2022/10/28/6ef7620cdb16ebe6.png', (text) => {
            texts.pop();
            texts.push({...text, offset: {x: (documentDot.width - 960) / 2, y: (documentDot.height - 200) / 2}})
        },
        {
            width: 960,
            height: 200
        });


    function loadDotsFormImage(src: string, callback: (text: DocumentTextImageData) => void, config?: { width: number, height: number }) {
        let image = new Image();
        image.src = src+"?"+new Date().getTime();
        image.setAttribute("crossOrigin","");
        image.onload = function () {
            let can = document.createElement('canvas');
            can.width = config?.width || documentDot.width;
            can.height = config?.height || documentDot.height;
            let ctx = can.getContext('2d') as CanvasRenderingContext2D;

            // @ts-ignore
            let c = ImageTools.contain({width: image.width, height: image.height}, {
                width: can.width,
                height: can.height
            });
            ctx.clearRect(0, 0, can.width, can.height);
            ctx.drawImage(image, c.dx, c.dy, c.dw, c.dh)
            imageData = ctx.getImageData(0, 0, can.width, can.height);
            callback({
                imageData,
                ctxMode: CtxMode.FillStroke,
                color: {
                    fill: (_dot) => `rgba(${_dot.rgba.r},${_dot.rgba.g},${_dot.rgba.b},${_dot.rgba.a})`,
                    stroke: (_dot) => `rgba(${_dot.rgba.r},${_dot.rgba.g},${_dot.rgba.b},${_dot.rgba.a})`
                },
                initDotMode: DotInitMode.Round
            })
        }
        image.onerror = function () {
            console.error('无法加载图片：', image.src)
        }
    }
})();




