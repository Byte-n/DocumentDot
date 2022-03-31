import './css/main.less'

import DocumentDot from "./script/DocumentDot";
// @ts-ignore
import ImageTools from "./script/ImageTools";
// @ts-ignore
import MobileDetect from "mobile-detect";
import {CtxMode, DocumentText, DocumentTextImageData, DotInitMode} from "./script/Type";

(function () {
    let mobileDetect = new MobileDetect(window.navigator.userAgent);
    let imageData;
    // let canvas = document.createElement('canvas');
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;
    // canvas.style.position = 'fixed'
    // canvas.style.top = '0'
    // canvas.style.left = '0'

    // document.body.append(canvas);

    let texts: Array<DocumentText> = [{
        text: "❤",
        fontSize: 9999,
        initDotMode: DotInitMode.Angle,
        ctxMode: CtxMode.Stroke,
        color: {fill: () => '#ff7272', stroke: () => '#ff7272'}
    }];
    texts = ['.','..','...']
    // texts = ["1.", "2..", "3...", "文档粒子"];
    // texts = [{text: 'A', color: {fill: () => 'red', stroke: () => 'red'}},
    // {text: 'a', color: {fill: () => '#fff', stroke: () => '#fff'}}]
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
            ctxMode: CtxMode.FillStroke,
            r: 2,
            cache: mobileDetect.mobile() == null,
            initDotMode: DotInitMode.Angle,
            pAmount: 100
        }
    }, "") as DocumentDot;
    documentDot.animation();
    // @ts-ignore
    window.documentDot = documentDot;
    texts = []
    loadDotsFormImage('res/2.png', (text) => {
        texts.push(text)
    });
    // loadDotsFormImage('res/2.png');
    // loadDotsFormImage('res/b.png');

    function loadDotsFormImage(src: string, callback: (text: DocumentTextImageData) => void) {
        let image = new Image();
        image.src = src;
        image.onload = function () {
            let can = document.createElement('canvas');
            can.width = documentDot.width;
            can.height = documentDot.height;
            let ctx = can.getContext('2d') as CanvasRenderingContext2D;
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




