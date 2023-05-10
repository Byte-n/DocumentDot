/**
 * @author Byte
 * @date 2021-02-09 16:04:46
 * @description 文档粒子动画
 */

import {
    AnalyzeCanvasConfig,
    CtxMode,
    DefaultDotColor,
    DocumentDotConfig,
    DocumentDotConfigCallback,
    DocumentText,
    DocumentTextImageData,
    DocumentTextString,
    DocumentTextStringExtend,
    DotColor,
    DotConfig,
    DotInitMode, MyCanvas
} from "./Type";
import Dot from "./Dot";
import { LogLevel } from "ts-loader/dist/logger";

class DocumentDot {

    enabled: boolean = true;
    // true 标识当前这一轮粒子绘制完毕，可以开始下一轮
    finished: boolean = true;
    textArray: Array<DocumentText>;
    //当前时刻需要绘制的所有粒子
    dots: Array<Dot> = new Array<Dot>();
    //原始的粒子数据
    dotList: Array<Dot> = new Array<Dot>();
    //上一波的历史粒子
    historyDot: Array<Dot> = new Array<Dot>();
    textCanvas: OffscreenCanvas

    textCtx: CanvasRenderingContext2D
    rafId: number = -1
    fontSize = 500
    fontFamily = 'Consoles, Helvetica, Helvetica, Arial, sans-serif'
    marginX = 0
    marginY = 0
    callback?: DocumentDotConfigCallback
    openingAnimation? = false;
    dotConfig: {
        color: DotColor,
        ctxMode: CtxMode,
        r: number,
        colourful: boolean,
        initDotMode: DotInitMode,
        pAmount: number
    }

    box: HTMLElement
    width: number
    height: number

    canvasList: Array<MyCanvas> = []

    /**
     *  无法绘制的情况下，会直接跳过。
     *  以下情况无法绘制：字符集不支持，以及画板上内容无效。
     * @param param
     * @param texts
     */
    constructor(param: DocumentDotConfig, ...texts: Array<DocumentText>) {
        if (!(param.box instanceof HTMLElement)) {
            throw new Error("box 无效");
        }
        this.textArray = [...texts];
        this.box = param.box;
        this.width = param.width || this.box.clientWidth;
        this.height = param.height || this.box.clientHeight;
        if (!(typeof this.width === 'number' && this.width > 0)) {
            throw new Error(`你必须 提供一个有效的宽度，box 有固定宽度，或指定 width: ${this.width}`);
        }
        if (!(typeof this.height === 'number' && this.height > 0)) {
            throw new Error(`你必须 提供一个有效的宽度，box 有固定高度，或指定 height: ${this.height}`);
        }
        console.log(this);
        this.createMyCanvas(param.dotConfig?.colourful ? (param.canvasCount || 3) : 1);
        this.textCanvas = new OffscreenCanvas(this.width, this.height);
        // this.textCanvas.width = this.width;
        // this.textCanvas.height = this.height;
        this.textCtx = this.textCanvas.getContext('2d') as unknown as CanvasRenderingContext2D;
        this.textCtx.textBaseline = "top";

        this.marginX = window.innerWidth / 10;
        this.marginY = window.innerHeight / 10;
        this.callback = param.callback;

        this.openingAnimation = param.openingAnimation;
        param.marginX && (this.marginX = param.marginX);
        param.marginY && (this.marginY = param.marginY);
        param.fontSize && (this.fontSize = param.fontSize);

        /**
         *  默认颜色值
         * @type {{fill: function(Dot):string, stroke: function(Dot):string}}
         */
        let dc: DotColor = {fill: () => '#fff', stroke: () => '#fff'};
        let isDotColor = false;
        if (param.dotConfig) {
            // 将颜色转为一个固定格式的函数
            const color = param.dotConfig.color;
            isDotColor = !!param.dotConfig.color;
            switch (typeof color) {
                case "string":
                    dc.stroke = dc.fill = (_d) => {
                        return color as string
                    }
                    break;
                case 'function':
                    dc.fill = (_d) => color(CtxMode.Fill, _d);
                    dc.stroke = (_d) => color(CtxMode.Stroke, _d);
                    break;
                case "object":
                    switch (typeof color.fill) {
                        case "string":
                            dc.fill = (_d) => {
                                return color.fill as string
                            }
                            break;
                        case "function":
                            dc.fill = color.fill
                            break;
                    }
                    switch (typeof color.stroke) {
                        case "string":
                            dc.stroke = () => {
                                return color.stroke as string
                            };
                            break;
                        case "function":
                            dc.stroke = color.stroke
                            break;
                    }
                    break;
            }
        }
        /**
         *  粒子配置
         */
        this.dotConfig = {
            color: isDotColor ? dc : DefaultDotColor,
            ctxMode: param.dotConfig ? (param.dotConfig.ctxMode ? param.dotConfig.ctxMode : CtxMode.Fill) : CtxMode.Fill,
            r: 2,
            colourful: param.dotConfig ? (param.dotConfig.colourful ? param.dotConfig.colourful : false) : false,
            initDotMode: param.dotConfig ? (param.dotConfig.initDotMode ? param.dotConfig.initDotMode : DotInitMode.Angle) : DotInitMode.Angle,
            pAmount: param.dotConfig ? (param.dotConfig.pAmount ? param.dotConfig.pAmount : 100) : 100
        };
        // 不开启缓存
        if (!this.dotConfig.colourful) {
            let d = new Dot({targetDot: {x: 0, y: 0}, color: this.dotConfig.color, pAmount: 100});
            for (let i = 0; i < this.canvasList.length; i++) {
                let ctx = this.canvasList[i].ctx;
                ctx.strokeStyle = this.dotConfig.color.stroke(d);
                ctx.fillStyle = this.dotConfig.color.fill(d);
            }
        }
        this.openingAnimation && this._openingAnimation();
    }

    createMyCanvas(count: number = 10) {
        if (count < 0) {
            return
        }
        let canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.position = 'fixed'
        canvas.style.top = '0'
        canvas.style.left = '0'
        this.box.append(canvas);
        this.canvasList.push({
            canvas,
            ctx: canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
            width: canvas.width,
            height: canvas.height
        })
        this.createMyCanvas(--count)
    }

    /**
     * 每一轮粒子运动完成或的回调
     */
    finishCallback() {
        if (!this.finished) {
            return;
        }
        if (this.textArray.length === 0) {
            this.enabled = false;
            window.cancelAnimationFrame(this.rafId);
            this.rafId = -1;
            let self = this;
            // 没有回调函数
            const cb = self.callback;
            if (!cb) {
                return;
            }
            // 执行回调函数
            cb.callback(self);
            // 是否移除回调函数
            if (cb.callbackType === 'one') {
                self.callback = undefined;
            }
            return;
        }
        let d = this.textArray.shift();
        // 不同种类的调用不同的方法处理
        // this.dotList=[]
        d && this._emit(d);
        this.enabled = true;
        this.finished = false;
        this.executeDraw();
    }

    /**
     * 开始动画
     */
    animation() {
        if (!this.finished) {
            return;
        }
        this.finished = true;
        this.finishCallback();
    }

    /**
     * 添加一个文本到队列中，如果队列为空，则会自动开始动画
     */
    emitDot(...texts: Array<DocumentText>) {
        if (texts.length === 0) {
            return;
        }
        let dt: DocumentText;
        for (let i = 0; i < texts.length; i++) {
            dt = texts[i];
            switch (typeof dt) {
                case "string":
                    if (dt.length === 0) break;
                    this.textArray.push(texts[i]);
                    break;
                default:
                    this.textArray.push(texts[i]);
                    break;
            }
        }
        this.animation();
    }

    _emit(config: DocumentText) {
        this.historyDot = this.dotList;
        let ds: Array<Dot> = new Array<Dot>();

        switch (typeof config) {
            case "object":
                if ((config as DocumentTextImageData).imageData instanceof ImageData) {
                    ds = this._emitImageData((config as DocumentTextImageData))
                } else if ([undefined, null, ''].indexOf((config as DocumentTextStringExtend).text) === -1) {
                    ds = this._emitText((config as DocumentTextStringExtend));
                }
                break;
            case "string":
                ds = this._emitText(config);
                break;
        }
        if (ds.length === 0) {
            this.dotList = this.historyDot;
            console.error('无法绘制：', config);
            this.finished = true;
            this.finishCallback();
        } else {
            this.dotList = ds;
            this.finished = false;
        }
    }

    /**
     * 无论时哪一种途径获取的文本。都支持两行，用'\n'分割
     * 默认文本：''
     * @private
     */
    _emitText(param: DocumentTextString | DocumentTextStringExtend): Array<Dot> {
        let text = '';
        let fontSize_ = this.fontSize;
        let initDotMode = this.dotConfig.initDotMode
        let ctxMode = this.dotConfig.ctxMode;
        let r = this.dotConfig.r;
        let color = this.dotConfig.color;

        switch (typeof param) {
            case "object":
                text = param.text;
                if (param.fontSize) {
                    fontSize_ = param.fontSize
                }
                if (param.initDotMode) {
                    initDotMode = param.initDotMode
                }
                if (param.ctxMode) {
                    ctxMode = param.ctxMode
                }
                if (param.r) {
                    r = param.r
                }
                if (param.color) {
                    color = param.color
                }
                break;
            case "string":
                text = param;
                break;
        }

        text.trim();
        if (text.length === 0) {
            return [];
        }

        //  支持两行，用 '\n' 分割
        let strings = text.split('\n');
        let length = strings.length > 1 ? 2 : 1;

        this.textCtx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        this.textCtx.fillStyle = "#fff";

        let h;
        for (let i = 0; i < length; i++) {
            text = strings[i];
            //字体大小优化
            this.textCtx.font = fontSize_ + 'px ' + this.fontFamily;
            fontSize_ = Math.min(
                fontSize_,
                ((this.textCanvas.width - this.marginX) / this.textCtx.measureText(text).width) * fontSize_,
                ((this.textCanvas.height - this.marginY) / fontSize_) * (this._isNumber(text) ? 1 : 0.5) * fontSize_
            );
            this.textCtx.font = fontSize_ + 'px ' + this.fontFamily;

            if (length === 2) {
                h = this.textCanvas.height / 2 - (fontSize_ * (1 - i));
            } else {
                h = this.textCanvas.height / 2 - (fontSize_ / 2);
            }
            this.textCtx.fillText(text, this.textCanvas.width / 2 - this.textCtx.measureText(text).width / 2, h);
        }

        return this._analyzeCanvas({
            imageData: this.textCtx.getImageData(0, 0, this.textCanvas.width, this.textCanvas.height),
            initDotMode,
            ctxMode,
            r,
            color
        });
    }

    _emitImageData(config: DocumentTextImageData): Array<Dot> {
        let imageData = config.imageData;
        if (!(imageData instanceof ImageData)) {
            return [];
        }
        let initDotMode = config.initDotMode || this.dotConfig.initDotMode;
        let ctxMode = config.ctxMode || this.dotConfig.ctxMode;
        let r = config.r || this.dotConfig.r;
        let boundary = {w: config.imageData.width, h: config.imageData.height} || {
            w: this.width,
            h: this.height
        };
        let color = config.color || this.dotConfig.color;
        let index = 0;

        return this._analyzeCanvas({
            offset: config.offset,
            imageData,
            initDotMode,
            ctxMode,
            r,
            color, index
        });
    }

    /**
     * 开场动画
     * @private
     */
    _openingAnimation(): void {
        this.dotList = [
            new Dot({
                initDot: {x: 0, y: 0},
                radius: this.dotConfig.r,
                targetDot: {x: 0, y: 0},
                color: this.dotConfig.color,
                ctxMode: this.dotConfig.ctxMode,
                colourful: this.dotConfig.colourful,
                pAmount: this.dotConfig.pAmount
            }),
            new Dot({
                initDot: {x: window.innerWidth, y: 0},
                radius: this.dotConfig.r,
                targetDot: {x: 0, y: 0},
                color: this.dotConfig.color,
                ctxMode: this.dotConfig.ctxMode,
                colourful: this.dotConfig.colourful,
                pAmount: this.dotConfig.pAmount
            }),
            new Dot({
                initDot: {x: window.innerWidth, y: window.innerHeight},
                radius: this.dotConfig.r,
                targetDot: {x: 0, y: 0},
                color: this.dotConfig.color,
                ctxMode: this.dotConfig.ctxMode,
                colourful: this.dotConfig.colourful,
                pAmount: this.dotConfig.pAmount
            }),
            new Dot({
                initDot: {x: 0, y: window.innerHeight},
                radius: this.dotConfig.r,
                targetDot: {x: 0, y: 0},
                color: this.dotConfig.color,
                ctxMode: this.dotConfig.ctxMode,
                colourful: this.dotConfig.colourful,
                pAmount: this.dotConfig.pAmount
            })
        ]
        this.textArray.unshift({text: '.', fontSize: 99})
    }

    /**
     *  数据处理
     * @private
     */
    _data() {
        let len = this.dotList.length;
        if (len === 0) {
            this.finished = true;
            return this.dots;
        }

        let finishedLen = 0;
        let ds = [];
        let d;
        for (let i = 0; i < len; i++) {
            d = this.dotList[i];
            if (d.move()) {//移动完成
                if (!d.finishedRemove) {
                    ds.push(d)
                }
                finishedLen++;
            } else {
                ds.push(d)
            }
        }
        this.dots = this.dotList = ds;
        this.finished = finishedLen === len;
        return this.dots;
    }

    executeDraw() {
        let dots = this._data().concat([]);
        let len = this.canvasList.length;
        let len2 = dots.length;
        let max = parseInt((len2 / (len)) + '');
        for (let i = 0; i < len; i++) {
            this._draw(dots.splice(0, max), this.canvasList[i]);
        }
        if (this.finished) {
            this.finishCallback()
        } else {
            this.rafId = window.requestAnimationFrame(this.executeDraw.bind(this));
        }

    }

    _draw(dots: Dot[], mc: MyCanvas) {
        let ctx = mc.ctx;
        let d, len;
        len = dots.length;

        ctx.clearRect(0, 0, this.width, this.height);

        if (this.dotConfig.colourful) {
            for (let i = 0; i < len; i++) {
                d = dots[i];
                if (d.colourful) {
                    ctx.drawImage(d.canvas, (0.5 + d.currentDot.x) << 0, (0.5 + d.currentDot.y) << 0);
                }
            }
            return;
        }

        ctx.beginPath();
        let P = 2 * Math.PI;
        for (let i = 0; i < len; i++) {
            d = dots[i]
            ctx.moveTo((0.5 + (d.currentDot.x + this.dotConfig.r)) << 0, (0.5 + d.currentDot.y) << 0)
            ctx.arc((0.5 + d.currentDot.x) << 0, (0.5 + d.currentDot.y) << 0, d.radius, 0, P);
        }
        ctx.closePath();
        switch (this.dotConfig.ctxMode) {
            case CtxMode.Fill:
                ctx.fill();
                break;
            case CtxMode.FillStroke:
                ctx.fill();
                ctx.stroke();
                break;
            case CtxMode.Stroke:
                ctx.stroke();
                break;
        }
    }

    /**
     *
     * @private
     * @return{Dot[]}
     */
    _analyzeCanvas(config: AnalyzeCanvasConfig) {
        let initDotMode = config.initDotMode;
        let ctxMode = config.ctxMode;
        let r = config.r || this.dotConfig.r;
        let colourful = this.dotConfig.colourful;
        let imageData = config.imageData;
        let index = typeof config.index === 'number' ? config.index : 0;
        let color = config.color || this.dotConfig.color;
        let offset = config.offset || {x: 0, y: 0}
        let dos = [];
        let __ = r <= 4 ? 1 : 2;
        for (let x = 0; x < imageData.width; x += ((r * 2) + __)) {
            for (let y = 0; y < imageData.height; y += ((r * 2) + __)) {
                let i = (y * imageData.width + x) * 4;
                if (imageData.data[i + 3] === 255) {
                    dos.push(
                        this._createDot({
                            targetDot: {x: x + offset.x, y: y + offset.y},
                            colourful,
                            radius: r,
                            initDotMode,
                            boundary: {w: this.width, h: this.height},
                            color,
                            ctxMode,
                            index: index++,
                            rgba: {
                                r: imageData.data[i],
                                g: imageData.data[i + 1],
                                b: imageData.data[i + 2],
                                a: imageData.data[i + 3] / 255
                            },
                            pAmount: this.dotConfig.pAmount
                        })
                    )
                }
            }
        }
        if (dos.length === 0) {
            return [];
        }
        // 存在多余的历史粒子
        if (this.historyDot.length !== 0) {
            let d, d2;
            let l = dos.length;
            while (this.historyDot.length !== 0) {
                d2 = this.historyDot.splice(~~(this.historyDot.length * Math.random()), 1)[0];
                d = dos[~~(l * Math.random())].clone();
                d2.set({
                    targetDot: d.targetDot,
                    radius: d.radius,
                    delay: d.delay,
                    color: d.color,
                    ctxMode: d.ctxMode,
                    index: index++,
                    rgba: d.rgba,
                    pAmount: d.pAmount
                })
                d2.finishedRemove = true;
                dos.push(d2);
            }
        }
        return dos;
    }

    /**
     * 创建粒子
     * @private
     */
    _createDot(config: DotConfig): Dot {
        let dot = this.historyDot.splice(~~(this.historyDot.length * Math.random()), 1)[0];
        if (dot) {// 回用历史粒子
            dot.set({
                p: 0,
                initDot: config.initDot,
                targetDot: config.targetDot,
                radius: config.radius,
                initDotMode: config.initDotMode,
                boundary: config.boundary,
                delay: config.delay,
                color: config.color,
                ctxMode: config.ctxMode,
                colourful: config.colourful,
                index: config.index,
                rgba: config.rgba,
                pAmount: config.pAmount
            })
            return dot;
        } else {
            return new Dot({
                initDot: config.initDot,
                targetDot: config.targetDot,
                radius: config.radius,
                initDotMode: config.initDotMode,
                boundary: config.boundary,
                delay: config.delay,
                color: config.color,
                ctxMode: config.ctxMode,
                colourful: config.colourful,
                index: config.index,
                rgba: config.rgba,
                pAmount: config.pAmount
            })
        }
    }

    _isNumber(n: string | number) {
        return !isNaN(parseFloat(n as string)) && isFinite(n as number);
    }

}

export default DocumentDot;
