/**
 * @author Byte
 * @date 2021-02-09 16:04:46
 * @description 文档粒子动画
 */
import Easing from "./Easing";

class DocumentDot {

  /**
   *  无法绘制的情况下，会直接跳过。
   *  以下情况无法绘制：字符集不支持，以及画板上内容无效。
   // *param={
   // *      canvas:HTMLCanvasElement,           canvas
   // *      callback = {
   // *           //callback 会在interval结束后触发
   // *          callback : function(DocumentDot) {
   // *              //..code
   // *          },
   // *          callbackType：'one',      one表示该回调函数在执行之后会被删除，'forever' 代表每次都会执行
   // *          delay: 回调函数延时执行，单位ms
   // *      },
   // *      openingAnimation:false,      是否有开场动画
   // *      marginX,                水平间距。文字水平方向的间距marginX=画板宽度-文本宽度
   // *      marginY,                垂直间距
   // *      fontSize,               默认文本大小，如果文本过大，则后面会自动效准
   // *      dotConfig: {          // 粒子设置
   // *        color: string | function('stroke'|'fill',Dot):string | {fill: string | function(Dot):string,stroke: string | function(Dot):string }, 参数为function时，如果cache为false,则函数的Dot为undefined。在初始化时，也会调用一次，传入的也是undefined
   // *        ctxMode: 'fill-stroke'|'stroke'|'fill'|'random',  random: cache为true时才有效，否则等效 'fill'
   // *        cache:boolean,    // true:开启缓存，则每个粒子单独绘制缓存，使得每个粒子不一样。
   // *        r: number  粒子半径,
   // *        initDotMode:('round'|'angle'|'random') 初始化点模式
   // *        }
   // *
   // * }
   *
   *  @param param{{
   *    canvas: HTMLCanvasElement,
   *    callback: {
   *      delay: number,
   *      callback: function(DocumentDot):void,
   *      callbackType: 'one' | 'forever'
   *    },
   *    openingAnimation?:boolean,
   *    marginX?:number,
   *    marginY?:number,
   *    fontSize?:number,
   *    dotConfig: {
   *      ctxMode: 'fill-stroke'|'stroke'|'fill'|'random',
   *      r: number,
   *      color: string | function('stroke'|'fill',Dot):string | {fill: string | function(Dot):string,stroke: string | function(Dot):string },
   *      cache:boolean,
   *      initDotMode:('round'|'angle'|'random')
   *     }
   *    }}
   * @param texts{
   *    string
   *   ||{text:string, fontSize?:number, initDotMode?:('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *   ||{imageData: ImageData, initDotMode?: ('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *  }
   */
  constructor(param, ...texts) {
    // noinspection JSUnusedGlobalSymbols
    this.enabled = true

    /**
     * true 标识当前这一轮粒子绘制完毕，可以开始下一轮
     * @type {boolean}
     */
    this.finished = true;

    /**
     * 文本数组
     * @type {
     * (
     *  string
     *  ||{text:string, fontSize?:number, initDotMode?:('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
     *  ||{imageData: ImageData, initDotMode?: ('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
     *  )[]}
     */
    this.textArray = [...texts];
    /**
     * 当前时刻需要绘制的所有粒子
     * @type {Dot[]}
     */
    this.dots = [];
    /**
     * 原始的粒子数据
     * @type {Dot[]}
     */
    this.dotList = []
    /**
     * 上一波的历史粒子
     * @type {Dot[]}
     */
    this.historyDot = [];

    this.canvas = param.canvas;
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = this.canvas.width;
    this.textCanvas.height = this.canvas.height;
    this.ctx = this.canvas.getContext('2d');
    this.textCtx = this.textCanvas.getContext('2d');
    this.textCtx.textBaseline = "top";

    this.rafId = null;

    this.fontSize = 500;
    this.fontFamily = 'Consoles, Helvetica, Helvetica, Arial, sans-serif';
    this.marginX = window.innerWidth / 10;
    this.marginY = window.innerHeight / 10;

    this.callback = null;


    param.callback && (this.callback = param.callback);
    this.openingAnimation = param.openingAnimation;
    !isNaN(param.marginX) && (this.marginX = param.marginX);
    !isNaN(param.marginY) && (this.marginY = param.marginY);
    !isNaN(param.fontSize) && (this.fontSize = param.fontSize);

    /**
     *  默认颜色值
     * @type {{fill: function(Dot):string, stroke: function(Dot):string}}
     */
    let dc = {fill: () => '#fff', stroke: () => '#fff'};
    let idm;
    if (param.dotConfig) {
      idm = (typeof param.dotConfig.initDotMode === 'string') ? param.dotConfig.initDotMode : 'random';
      // 将颜色转为一个固定格式的函数
      if (param.dotConfig.color) {
        switch (typeof param.dotConfig.color) {
          case "string":
            dc.stroke = dc.fill = (_d) => param.dotConfig.color
            break;
          case 'function':
            dc.fill = (_d) => param.dotConfig.color('fill', _d);
            dc.stroke = (_d) => param.dotConfig.color('stroke', _d);
            break;
          case "object":
            switch (typeof param.dotConfig.color.fill) {
              case "string":
                dc.fill = () => param.dotConfig.color.fill;
                break;
              case "function":
                dc.fill = param.dotConfig.color.fill
                break;
            }
            switch (typeof param.dotConfig.color.stroke) {
              case "string":
                dc.stroke = () => param.dotConfig.color.stroke;
                break;
              case "function":
                dc.stroke = param.dotConfig.color.stroke
                break;
            }
            break;
        }
      }
    }
    /**
     *  粒子配置
     * @type {{
     * ctxMode: ('fill-stroke'|'stroke'|'fill'|'random'),
     * r: number,
     * cache: boolean,
     * color: {fill: function(Dot):string, stroke: function(Dot):string},
     * initDotMode:('round'|'angle'|'random')
     * }}
     */
    this.dotConfig = {
      color: dc,
      ctxMode: param.dotConfig.ctxMode || 'fill',
      r: param.dotConfig.r || 2,
      cache: param.dotConfig.cache,
      initDotMode: idm
    };

    this.ctx.strokeStyle = this.dotConfig.color.stroke(undefined);
    this.ctx.fillStyle = this.dotConfig.color.fill(undefined);
    this.openingAnimation === true && this._openingAnimation();
  }

  /**
   * 开始动画
   */
  animation() {
    if (typeof this.interval === "number") {
      return;
    }
    let self = this;
    let d, fsi;
    this.interval = setInterval(function () {
      if (self.textArray.length === 0) {
        //等待完成
        if (!self.finished) {
          return;
        }

        clearInterval(self.interval);
        self.interval = null;

        // 没有回调函数
        if (!self.callback.callback instanceof Function) {
          self.callback = null;
          self.stop();
          return;
        }
        // 有回调函数
        setTimeout(function () {
          self.stop();
          // 执行回调函数
          self.callback.callback(self);
          // 是否移除回调函数
          if (self.callback.callbackType === 'one') {
            self.callback = null;
          }
        }, self.callback.delay ? self.callback.delay : 0);
      }
      if (self.finished === true) {
        d = self.textArray.shift();
        // 不同种类的调用不同的方法处理
        d && self._emit(d);
        if (self.rafId === null) {
          self.start();
        }
      }
    }, 10);
  }

  /**
   * 添加一个文本到队列中，如果队列为空，则会自动开始动画
   * @param texts{ string
   *  || {text:string, fontSize?:number, initDotMode?:('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *  || {imageData: ImageData, initDotMode?: ('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *  }
   */
  emitDot(...texts) {
    if (texts.length === 0) {
      return;
    }
    for (let i = 0; i < texts.length; i++) {
      if (texts[i].length === 0) return false;
      this.textArray.push(texts[i]);
    }
    !this.interval && this.animation();
  }

  /**
   *
   * @param config{ string
   *  || {text:string, fontSize?:number, initDotMode?:('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *  || {imageData: ImageData, initDotMode?: ('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}
   *  }
   * @private
   */
  _emit(config) {
    this.historyDot = this.dotList;
    let ds;
    switch (typeof config) {
      case "object":
        if (config.imageData instanceof ImageData) {
          ds = this._emitImageData(config)
        } else if ([undefined, null, ''].indexOf(config.text) === -1) {
          ds = this._emitText(config);
        }
        break;
      case "string":
        ds = this._emitText(config);
        break;
      default:
        ds = []
        break;
    }
    if (ds.length === 0) {
      this.dotList = this.historyDot;
      console.error('无法绘制：', config);
      this.finished = true;
    } else {
      this.dotList = ds;
      this.finished = false;
    }
  }

  /**
   * 无论时哪一种途径获取的文本。都支持两行，用'\n'分割
   * 默认文本：''
   *
   * @param param { string || {text:string, fontSize?:number, initDotMode?:('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}}
   * @return {Dot[]}
   * @private
   */
  _emitText(param) {
    let text = '';
    let fontSize_ = this.fontSize;
    let initDotMode = this.dotConfig.initDotMode
    let ctxMode = this.dotConfig.ctxMode;
    let r = this.dotConfig.r;
    let color = this.dotConfig.color;

    switch (typeof param) {
      case "object":
        text = param.text;
        if (!isNaN(param.fontSize)) {
          fontSize_ = param.fontSize
        }
        if (param.initDotMode){
          initDotMode = param.initDotMode
        }
        if (param.initDotMode){
          ctxMode = param.ctxMode
        }
        if (param.r){
          r = param.r
        }
        if (param.color){
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
      boundary: {w: this.canvas.width, h: this.canvas.height},
      cache: this.dotConfig.cache,
      color
    });
  }

  /**
   * @param config{{imageData: ImageData, initDotMode?: ('round'|'angle'|'random'), ctxMode?:('fill'|'fill-stroke'|'stroke'|'random'), r?:number, color?:{fill: (function(Dot): string), stroke: (function(Dot): string)}}}
   * @return {Dot[]}
   * @private
   */
  _emitImageData(config) {
    let imageData = config.imageData;
    if (!(imageData instanceof ImageData)) {
      return [];
    }
    let initDotMode = config.initDotMode || this.dotConfig.initDotMode;
    let ctxMode = config.ctxMode || this.dotConfig.ctxMode;
    let r = config.r || this.dotConfig.r;
    let boundary = {w: config.imageData.width, h: config.imageData.height} || {
      w: this.canvas.width,
      h: this.canvas.height
    };
    let cache = this.dotConfig.cache;
    let color = config.color || this.dotConfig.color;
    let index = 0;

    return this._analyzeCanvas({
      imageData,
      initDotMode,
      ctxMode,
      r,
      boundary,
      cache,
      color, index
    });
  }

  /**
   * 开场动画
   * @private
   */
  _openingAnimation() {
    this.dotList = [
      new Dot({
        initDot: {x: 0, y: 0},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0},
        color: this.dotConfig.color,
        ctxMode: this.dotConfig.ctxMode,
        cache: this.dotConfig.cache
      }),
      new Dot({
        initDot: {x: window.innerWidth, y: 0},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0},
        color: this.dotConfig.color,
        ctxMode: this.dotConfig.ctxMode,
        cache: this.dotConfig.cache
      }),
      new Dot({
        initDot: {x: window.innerWidth, y: window.innerHeight},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0},
        color: this.dotConfig.color,
        ctxMode: this.dotConfig.ctxMode,
        cache: this.dotConfig.cache
      }),
      new Dot({
        initDot: {x: 0, y: window.innerHeight},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0},
        color: this.dotConfig.color,
        ctxMode: this.dotConfig.ctxMode,
        cache: this.dotConfig.cache
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
        if (!d.finishdRemove) {
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

  _draw() {
    let dots = this._data();
    let ctx = this.ctx;

    let d, len;
    len = dots.length;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.dotConfig.cache) {
      for (let i = 0; i < len; i++) {
        d = dots[i];
        if (d.cahce) {
          ctx.drawImage(d.canvas, (0.5 + d.currentDot.x) << 0, (0.5 + d.currentDot.y) << 0);
        }
      }
      this.rafId = window.requestAnimationFrame(this._draw.bind(this));
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
      case "fill":
        ctx.fill();
        break;
      case 'stroke':
        ctx.stroke();
        break;
      case 'fill-stroke':
        ctx.fill();
        ctx.stroke();
        break;
      case 'random':
      default:
        ctx.fill();
    }

    if (this.finished) {
      this.cancelAnimationFrame();
      return;
    }
    this.rafId = window.requestAnimationFrame(this._draw.bind(this));
  }

  /**
   *
   * @private
   * @param config{{
   *   imageData?:ImageData,
   *   initDotMode:'random'|'round'|'angle',
   *   ctxMode: 'fill'|'fill-stroke'|'stroke'|'random',
   *   r: number,
   *   boundary?: {w: number, h: number},
   *   index?: number,
   *   cache: boolean,
   *   color:  {fill: (function(Dot): string), stroke: (function(Dot): string)}
   * }}
   * @return{Dot[]}
   */
  _analyzeCanvas(config) {
    let initDotMode = config.initDotMode === 'random' ? (Math.random() < 0.5 ? 'round' : 'angle') : config.initDotMode;
    let ctxMode = () => config.ctxMode === 'random' ? (Math.random() < 0.5 ? 'fill' : 'stroke') : config.ctxMode;
    let r = config.r;
    let cache = config.cache;
    let boundary = config.boundary || {w: this.canvas.width, h: this.canvas.height};
    let imageData = config.imageData || this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    let index = typeof config.index === 'number' ? config.index : 0;
    let color = config.color;
    let dos = [];
    let __ = r <= 4 ? 1 : 2;
    for (let x = 0; x < imageData.width; x += ((r * 2) + __)) {
      for (let y = 0; y < imageData.height; y += ((r * 2) + __)) {
        let i = (y * imageData.width + x) * 4;
        if (imageData.data[i + 3] === 255) {
          dos.push(
            this._createDot({
              targetDot: {x, y},
              cache,
              radius: r,
              initDotMode,
              boundary: boundary,
              color,
              ctxMode: ctxMode(),
              index: index++,
              rgba: {
                r: imageData.data[i],
                g: imageData.data[i + 1],
                b: imageData.data[i + 2],
                a: imageData.data[i + 3] / 255
              }
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
          rgba: d.rgba
        })
        d2.finishdRemove = true;
        dos.push(d2);
      }
    }
    return dos;
  }

  /**
   * 创建粒子
   * @private
   * @param config{{
   *   initDot?: {
   *     x: number,
   *     y: number
   *   },
   *   targetDot: {
   *     x: number,
   *     y: number
   *   },
   *   cache?: boolean,
   *   radius?: number,
   *   initDotMode?: 'round' | 'angle',
   *   boundary?: {w:number,h:number},
   *   delay?: number,
   *   color?:{fill: function(Dot):string, stroke: function(Dot):string},
   *   rgba?:{r:number,g:number,b:number,a:number},
   *   ctxMode?:('fill'|'fill-stroke'|'stroke'),
   *   index: number
   * }}
   * @return {Dot}
   */
  _createDot(config) {
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
        cache: config.cache,
        index: config.index,
        rgba: config.rgba
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
        cache: config.cache,
        index: config.index,
        rgba: config.rgba
      })
    }
  }

  _isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  start() {
    this.enabled = true;
    this._draw();
  }

  stop(rightNow = false) {
    this.enabled = false;
    if (rightNow === true) {
      this.cancelAnimationFrame();
    }
  }

  cancelAnimationFrame() {
    window.cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

}

class Dot {
  /**
   *  ctxMode: random 指的是随机 'fill' 和 'stroke'
   * @param config{{
   *   initDot?: {
   *     x: number,
   *     y: number
   *   },
   *   targetDot: {
   *     x: number,
   *     y: number
   *   },
   *   cache:boolean,
   *   radius?: number,
   *   initDotMode?: 'round' | string,
   *   boundary?: {w:number,h:number},
   *   delay?: number,
   *   color?:{fill: function(Dot):string, stroke: function(Dot):string},
   *   rgba?:{r:number,g:number,b:number,a:number},
   *   ctxMode?:('fill'|'fill-stroke'|'stroke'),
   *   index?:number
   * }}
   */
  constructor(config) {
    /**
     * 半价
     * @type {number}
     */
    this.radius = config.radius || 2;
    /**
     * 初始化点
     * @type {{x: number, y: number}}
     */
    this.initDot = {x: 0, y: 0}
    if (config.initDot) {
      this.initDot = config.initDot
    } else {
      this.setInitDot(config.initDotMode || 'round', config.boundary || {w: window.innerWidth, h: window.innerHeight});
    }
    /**
     * 目标点
     * @type {{x: number, y: number}}
     */
    this.targetDot = config.targetDot || {x: 0, y: 0}


    /**
     * 延迟运动
     * @type {number}
     */
    this.delay = config.delay || 123 * Math.random();
    this.delayCount = 0;

    /**
     * 进度
     * @type {number}
     */
    this.p = 0;

    /**
     * 当前点
     * @type {{x: number, y: number}}
     */
    this.currentDot = {};
    Object.assign(this.currentDot, this.initDot);

    /**
     * 是否完成
     * @type {boolean}
     */
    this.finished = false;
    /**
     * 完成后是否删除
     * @type {boolean}
     */
    this.finishdRemove = false;

    /**
     * 序号
     * @type {number}
     */
    this.index = config.index
    /**
     * 颜色
     * @type {{fill: function(Dot):string, stroke: function(Dot):string}}
     */
    this.color = config.color || {
      fill: '#Fff',
      stroke: '#fff'
    }
    /**
     * 原始图像的颜色。
     * @type {{r: number, g: number, b: number, a: number}|{}}
     */
    this.rgba = config.rgba || {}
    /**
     * 绘制模式
     * @type {'fill'|'fill-stroke'|'stroke'}
     */
    this.ctxMode = 'fill';
    this.setCtxMode(config.ctxMode)
    /**
     * 缓存
     * @type {boolean}
     */
    this.cahce = config.cache;
    this._refreshCache = false;

    if (!this.cahce) {
      return;
    }
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.radius * 2;
    this.canvas.height = this.radius * 2;
    this.ctx = this.canvas.getContext('2d');
    this.refreshCache();
  }

  /**
   *
   * @param ctxMode{'fill'|'fill-stroke'|'stroke'}
   */
  setCtxMode(ctxMode) {
    if (!ctxMode) {
      return;
    }
    // if (ctxMode === 'random') {
    //   ctxMode = Math.random() < 0.5 ? 'fill' : 'stroke'
    // }
    this.ctxMode = ctxMode;
  }

  /**
   * @param config{{
   *   initDot?: {
   *     x: number,
   *     y: number
   *   },
   *   targetDot?: {
   *     x: number,
   *     y: number
   *   },
   *   cache?:boolean,
   *   radius?: number,
   *   initDotMode?: 'round' | 'angle',
   *   boundary?: {w:number,h:number},
   *   delay?: number,
   *   color?:{fill: function(Dot):string, stroke: function(Dot):string},
   *   rgba?:{r:number,g:number,b:number,a:number},
   *   ctxMode?:('fill'|'fill-stroke'|'stroke'),
   *   index?:number,
   *   p?:number
   * }}
   */
  set(config) {
    if (config.initDot) {
      this.initDot = config.initDot;
    } else if (config.initDotMode && config.boundary) {
      this.setInitDot(config.initDotMode, config.boundary);
    }
    if (config.targetDot) {
      this.setNewTargetDot(config.targetDot);
    }
    if (config.delay) {
      this.delay = config.delay;
      this.delayCount = 0;
    }
    if (config.index) {
      this.index = config.index;
    }
    if (config.p) {
      this.p = config.p;
    }
    if (config.rgba) {
      this.rgba = config.rgba;
      this._refreshCache = true;
    }
    if (config.cache) {
      this.cahce = config.cache;
      this._refreshCache = true;
    }
    if (config.radius && config.radius !== this.radius) {
      this.radius = config.radius;
      this._refreshCache = true;
    }
    if (
      config.color
      &&
      (this.color.fill !== config.color.fill || this.color.stroke !== config.color.stroke)
    ) {
      this.color = config.color;
      this._refreshCache = true;
    }
    if (config.ctxMode && config.ctxMode !== this.ctxMode) {
      this.setCtxMode(config.ctxMode);
      this._refreshCache = true;
    }
  }

  refreshCache() {
    if (!this.cahce) {
      return;
    }
    this.ctx.fillStyle = this.color.fill(this);
    this.ctx.strokeStyle = this.color.stroke(this);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    this.ctx.arc(this.radius, this.radius, this.radius - 0.5, 0, Math.PI * 2);
    this.ctx.closePath();
    switch (this.ctxMode) {
      case "fill":
        this.ctx.fill();
        break;
      case 'stroke':
        this.ctx.stroke();
        break;
      case 'fill-stroke':
        this.ctx.fill();
        this.ctx.stroke();
        break;
      default:
        this.ctx.fill();
    }
    this.ctx.save();
  }

  /**
   * 克隆
   * @return {Dot}
   */
  clone() {
    // let d = new Dot({
    //   initDot: this.initDot,
    //   targetDot: this.targetDot,
    //   radius: this.radius,
    //   cache: true,
    //   color: this.color
    // });
    // Object.assign(d.currentDot, this.currentDot)
    // d.delay = this.delay;
    // d.delayCount = this.delayCount;
    // d.p = this.p;
    // d.finished = this.finished;
    // d.finishdRemove = this.finishdRemove;
    //
    // d.color.fill = this.color.fill;
    // d.color.stroke = this.color.stroke;
    // d.rgba = this.rgba;
    // d.ctxMode = this.ctxMode;
    // d.cahce = this.cahce;
    // d.index = this.index;
    // d.refreshCache();
    let config = {...this};
    let d = new Dot(config);
    d.delayCount = this.delayCount;
    d.p = this.p;
    d.finished = this.finished;
    d.finishdRemove = this.finishdRemove;
    d._refreshCache = this._refreshCache;
    return d;
  }

  /**
   *  重新设置目标点,并重置p,finished,delayCount
   * @param target{{x:number,y:number}}
   */
  setNewTargetDot(target) {
    Object.assign(this.initDot, this.currentDot);
    Object.assign(this.targetDot, target);
    this.p = 0;
    this.finished = false;
    this.delayCount = 0;
  }

  /**
   * 设置初始点位置
   * @param mode{'round' | 'angle'}
   * @param boundary{{w:number,h:number}}
   */
  setInitDot(mode, boundary) {
    let w = boundary.w;
    let h = boundary.h;
    //随机四个角
    switch (mode) {
      case "round":
        //四周
        if (Math.random() > 0.5) {
          this.initDot = {
            x: Math.random() > 0.5 ? w + (this.radius * 2) : -(this.radius * 2),
            y: Math.random() * h
          };
        } else {
          this.initDot = {
            x: Math.random() * w,
            y: Math.random() > 0.5 ? h + (this.radius * 2) : -(this.radius * 2)
          };
        }
        break;
      case "angle":
        this.initDot = {
          x: Math.random() > 0.5 ? w + (this.radius * 2) : -(this.radius * 2),
          y: Math.random() > 0.5 ? h + (this.radius * 2) : -(this.radius * 2)
        };
        break;
      default:
        this.initDot = {
          x: 0,
          y: 0
        }
        break;
    }
  }

  /**
   *  移动
   *  <br> 动画速度：easeInOutSine
   * @param target{{x:number,y:number}} 目标点
   * @return{boolean} true:已经到达目标点，false: 未到达或者未开始移动
   */
  move(target = undefined) {
    if (this.delayCount < this.delay) {
      this.delayCount++;
      return false;
    }
    if (this.finished || this.p >= 200) {
      this.finished = true;
      return true;
    }
    if (this._refreshCache === true && this.p >= 52) {
      this._refreshCache = false;
      // 异步
      setTimeout(function () {
        this.refreshCache();
      }.bind(this), 0)
    }
    target = target || this.targetDot;
    this.p += 1;
    let p = Easing.easeInOutSine(this.p / 200);
    let x = this.initDot.x + (target.x - this.initDot.x) * p;
    let y = this.initDot.y + (target.y - this.initDot.y) * p;
    this.currentDot = {
      x, y
    }
    return false;
  }
}

export default DocumentDot;
