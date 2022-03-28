import './css/main.less'

import DocumentDot from "./script/DocumentDot";
// @ts-ignore
import ImageTools from "./script/ImageTools";
// @ts-ignore
import MobileDetect from "mobile-detect";
import {CtxMode, DocumentText, DotInitMode} from "./script/Type";

(function () {
    let mobileDetect = new MobileDetect(window.navigator.userAgent);
    let imageData;
    let canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed'
    canvas.style.top = '0'
    canvas.style.left = '0'

    document.body.append(canvas);

    let texts:Array<DocumentText> = [{
        text: "❤",
        fontSize: 9999,
        initDotMode: DotInitMode.Angle,
        ctxMode: CtxMode.Stroke,
        color: {fill: () => '#ff7272', stroke: () => '#ff7272'}
    }];
    // texts = ["1.", "2..", "3...", "文档粒子"];
    // texts = [{text: 'A', color: {fill: () => 'red', stroke: () => 'red'}},
    //   {text: 'a', color: {fill: () => '#fff', stroke: () => '#fff'}}]
    let i = 0;
    const documentDot = new DocumentDot({
        canvas: canvas,
        marginX: 10,
        marginY: 10,
        callback: {
            callback(_d) {
                if (i===2){
                    return;
                }
                i++;
                _d.emitDot(...texts)
            },
            callbackType: 'forever'
        },
        openingAnimation: false,
        dotConfig: {
            color: '#ff7272',
            ctxMode: CtxMode.FillStroke,
            r: 2,
            cache: mobileDetect.mobile()==null,
            initDotMode: DotInitMode.Angle,
            pAmount:1
        }
    }, {text: "❤", fontSize: 9999}) as DocumentDot;
    documentDot.animation();
    // @ts-ignore
    window.documentDot=documentDot;
    texts=[]
    loadDotsFormImage('res/a.png');
    // loadDotsFormImage('res/2.png');

    function loadDotsFormImage(src:string) {
        let image = new Image();
        image.src = src;
        image.onload = function () {
            let can = document.createElement('canvas');
            can.width = documentDot.canvas.width;
            can.height = documentDot.canvas.height;
            let ctx = can.getContext('2d') as CanvasRenderingContext2D;
            let c = ImageTools.contain({width: image.width, height: image.height}, {width: can.width, height: can.height});
            ctx.clearRect(0, 0, can.width, can.height);
            ctx.drawImage(image, c.dx, c.dy, c.dw, c.dh)
            imageData = ctx.getImageData(0, 0, can.width, can.height);
            texts.unshift({
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




