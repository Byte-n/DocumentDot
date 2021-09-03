/**
 * @author Byte
 * @date 2021-02-09 16:04:46
 * @description 文档粒子动画
 */
import Easing from "./Easing";

class DocumentDot {
  /**
   *
   *param={
   *      canvas:canvas,           canvas 对象 或者 css选择器
   *      callback = {
   *           //callback 会在interval结束后触发
   *          callback : function(DocumentDot) {
   *              //..code
   *          },
   *          callbackType：'one',      one表示该回调函数在执行之后会被删除，'for ever' 代表每次都会执行
   *          delay: 回调函数延时执行，单位ms
   *      },
   *      openingAnimation:false,      是否有开场动画
   *      marginX,                水平间距。文字水平方向的间距marginX=画板宽度-文本宽度
   *      marginY,                垂直间距
   *      fontSize,               默认文本大小，如果文本过大，则后面会自动效准
   *      error:{
   *          enable: boolean   是否开启非法字符提示，不开启，则会跳过非法字符（当前字体无法显示的，与设备也有关）的文档粒子动画，否则会使用text属性指定的问题替代进行动画。
   *                            备注：通常被识别为非法字符是因为当前画板无法绘制当前文本，也就是当前字体无法显示该文本！如果是字符集不支持，那么应该是乱码！如果正常字符中包括部分非法字符，则正常字符会被绘制，而非法字符不会被绘制。
   *          text:   string || {text:string,fontSize:number}    非法字符提示文本。
   *      },
   *      dotConfig: {          // 粒子设置
   *        color: string || {fill:string,stroke:string},
   *        mode: 'fill-stroke'|'stroke'|'fill',
   *        r: number  粒子半径
   *
   *        }
   *
   * }
   *
   *  @param param{{
   *    canvas: HTMLCanvasElement, 
   *    callback: {
   *      delay: number, 
   *      callback: (function(DocumentDot):void), 
   *      callbackType: ('one' | 'for ever')
   *    }, 
   *    openingAnimation?:boolean,
   *    marginX?:number,
   *    marginY?:number,
   *    fontSize?:number, 
   *    error?: {
   *      enable:boolean,
   *      text: string||{text:string,fontSize:number}
   *    },
   *    dotConfig: {
   *      mode: string|| {fill:string,stroke:string},
   *      r: number, 
   *      color: 'fill-stroke'|'stroke'|'fill'
   *     }
   *    }}
   * @param texts
   */
  constructor(param, ...texts) {
    this.enabled = true


    /**
     * true 标识当前这一轮粒子绘制完毕，可以开始下一轮
     * @type {boolean}
     */
    this.finished = true;
    /**
     * 文本数组
     * @type {(string|{text:string,fontSize:number})[]}
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
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.rafId = null;

    this.fontSize = 500;
    this.fontFamily = 'Consoles, Helvetica, Helvetica, Arial, sans-serif';

    this.marginX = window.innerWidth / 9;
    this.marginY = window.innerHeight / 9;

    this.callback = null;
    this.error = {enable: true, text: {text: 'ERROR！', fontSize: 222}};
    this.defaultError = {text: 'ERROR!', fontSize: 222};
    this.dotConfig = {color: {fill: '#fff', stroke: '#fff'}, mode: 'fill', r: 2};

    param.callback && (this.callback = param.callback);
    this.openingAnimation = param.openingAnimation;
    !isNaN(param.marginX) && (this.marginX = param.marginX);
    !isNaN(param.marginY) && (this.marginY = param.marginY);
    !isNaN(param.fontSize) && (this.fontSize = param.fontSize);
    Object.assign(this.error, param.error)

    let dc = this.dotConfig.color;
    if (param.dotConfig) {
      switch (typeof param.dotConfig.color){
        case "string":
          dc.fill = param.dotConfig.color;
          dc.stroke = param.dotConfig.color;
          break;
        case "object":
          dc.fill = param.dotConfig.color.fill;
          dc.stroke = param.dotConfig.color.stroke;
          break;
      }
    }
    Object.assign(this.dotConfig, param.dotConfig)
    this.dotConfig.color = dc;


    this._resetCanvas();
    this.openingAnimation === true && this._openingAnimation();
  }

  /**
   * 开场动画
   * @private
   */
  _openingAnimation() {
    let fs = this.fontSize;
    this.dotList = [
      new Dot({
        initDot: {x: 0, y: 0},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0}
      }),
      new Dot({
        initDot: {x: window.innerWidth, y: 0},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0}
      }),
      new Dot({
        initDot: {x: window.innerWidth, y: window.innerHeight},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0}
      }),
      new Dot({
        initDot: {x: 0, y: window.innerHeight},
        radius: this.dotConfig.r,
        targetDot: {x: 0, y: 0}
      })
    ]
    this.fontSize = 99;
    this._emitDot('.');
    this.fontSize = fs;
  }

  /**
   * 开始动画
   */
  animation() {
    let self = this;
    this.interval = setInterval(function () {
      if (self.textArray.length === 0) {
        //等待完成
        if (!self.finished) {
          return;
        }

        clearInterval(self.interval);
        self.interval = null;

        if (self.callback === null || !self.callback.callback instanceof Function) {
          self.callback = null;
          return;
        }
        setTimeout(function () {
          self.callback.callback(self);
          if (self.callback.callbackType === 'one') {
            self.callback = null;
          }
        }, self.callback.delay ? self.callback.delay : 0);
      }
      if (self.finished === true) {
        self._emitDot(self.textArray.shift());
      }
    }, 100);
  }

  /**
   * 添加一个文本到队列中，如果队列为空，则会自动开始动画
   * @param texts
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
   * param如果是函数，则应该返回一个字符串，并且该函数没有参数。
   * 无论时哪一种途径获取的文本。都支持两行，用'\n'分割
   * 默认文本：'NULL'
   *
   *  如果fontSize过大，就会自动效准
   * @param param {string || function || {text:string,fontSize:number}}
   * @private
   */
  _emitDot(param) {
    /**
     *
     * @type {string || function || {text:string,fontSize:number}}
     */
    let text = '';
    let fontSize_ = this.fontSize;

    if (typeof param === 'object') {
      text = param.text;
      if (!isNaN(param.fontSize)) {
        fontSize_ = param.fontSize
      }
    } else if (typeof param === 'string') {
      text = param;
    } else if (typeof param === 'function') {
      text = param();
    }
    text.trim();
    if (text.length === 0) {
      return;
    }

    if (this.rafId) window.cancelAnimationFrame(this.rafId);

    //  支持两行，用 '\n' 分割
    let strings = text.split('\n');
    let length = strings.length > 1 ? 2 : 1;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#fff";

    let h;
    for (let i = 0; i < length; i++) {
      text = strings[i];
      //字体大小优化
      this._setFontSize(fontSize_);
      fontSize_ = Math.min(
        fontSize_,
        ((this.canvas.width - this.marginX) / this.ctx.measureText(text).width) * fontSize_,
        ((this.canvas.height - this.marginY) / fontSize_) * (this._isNumber(text) ? 1 : 0.5) * fontSize_
      );
      this._setFontSize(fontSize_);

      if (length === 2) {
        h = this.canvas.height / 2 - (fontSize_ * (1 - i));
      } else {
        h = this.canvas.height / 2 - (fontSize_ / 2);
      }
      this.ctx.fillText(text, this.canvas.width / 2 - this.ctx.measureText(text).width / 2, h);
    }


    this.historyDot = this.dotList;
    this.dotList = [];

    this._analyzeCanvas();

    //初始化失败
    if (this.dotList.length === 0) {
      //重置，不然dotList就是空数组
      this.dotList = this.historyDot;
      if (this.error.enable === true) {
        let t = this.error.text;
        if (this.error.text instanceof Function) {
          t = this.error.text();
        }
        this.textArray.unshift(t === text ? this.defaultError : t);
      } else {
        //清空画板,因为画板上面可能会有未能被识别的像素
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.finished = true;
      return;
    } else {
      this.finished = false;
    }

    this._draw(text, h);
  }

  /**
   *  数据处理
   * @private
   */
  _data() {
    this.dots = [];
    let len = this.dotList.length;
    if (len === 0) {
      this.finished = true;
      return;
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
    this.dotList = ds;
    this.finished = finishedLen === len;
    this.dots.push(...ds)
  }

  /**
   *
   * @private
   */
  _draw(text, h) {
    // window.text=text;
    if (!this.enabled) {
      return;
    }
    this._data();

    this._resetCanvas();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    // this.ctx.fillText(text, this.canvas.width / 2 - this.ctx.measureText(text).width / 2, h);

    let d, pos;

    for (let i = 0; i < this.dots.length; i++) {
      d = this.dots[i]
      pos = d.currentDot;
      this.ctx.moveTo(pos.x + this.dotConfig.r, pos.y)
      this.ctx.arc(pos.x, pos.y, d.radius, 0, 2 * Math.PI);
    }

    this.ctx.closePath();
    switch (this.dotConfig.mode) {
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

    this.rafId = window.requestAnimationFrame(this._draw.bind(this, text, h));
  }

  /**
   * 设置字体
   * @param fontSize{number}
   * @private
   */
  _setFontSize(fontSize) {
    this.ctx.font = fontSize + 'px ' + this.fontFamily;
  }

  _resetCanvas() {
    this.ctx.textBaseline = "top";
    this.ctx.strokeStyle = this.dotConfig.color.stroke ;
    this.ctx.fillStyle = this.dotConfig.color.fill;
  }

  _isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  /**
   *
   * @private
   */
  _analyzeCanvas() {
    let m = Math.random() < 0.5 ? 'round' : '';
    let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    let r = this.dotConfig.r;
    let boundary = {w: this.canvas.width, h: this.canvas.height};
    for (let x = 0; x < imgData.width; x += ((r * 2) + 2)) {
      for (let y = 0; y < imgData.height; y += ((r * 2) + 2)) {
        let i = (y * imgData.width + x) * 4;
        if (imgData.data[i + 3] === 255) {
          this.dotList.push(this.createDot({x, y}, r, m, boundary))
        }
      }
    }
    // 存在多余的历史粒子
    if (this.historyDot.length !== 0) {
      let d, arr, d2;
      arr = [];
      let l = this.dotList.length;
      while (this.historyDot.length !== 0) {
        d2 = this.historyDot.pop();
        d = this.dotList[~~(l * Math.random())].clone();
        d2.finishdRemove = true;
        d2.setNewTargetDot(d.targetDot);
        arr.push(d2);
      }
      this.dotList.push(...arr);
    }
  }

  /**
   * 创建粒子
   * @param targetDot{{x:number,y:number}}
   * @param radius{number}
   * @param initDotMode{'round'|string}
   * @param boundary{{w:number,h:number}}
   * @return {Dot}
   */
  createDot(targetDot, radius, initDotMode, boundary) {
    let dot = this.historyDot.pop();
    if (dot) {
      dot.setNewTargetDot(targetDot);
      return dot;
    } else {
      return new Dot({
        targetDot,
        radius,
        initDotMode,
        boundary
      })
    }
  }

  // noinspection JSUnusedGlobalSymbols
  start() {
    this.enabled = true;
    this._draw();
  }

  // noinspection JSUnusedGlobalSymbols
  stop() {
    this.enabled = false;
    window.cancelAnimationFrame(this.rafId);
  }

}

class Dot {
  /**
   *
   * @param config{{
   *   initDot?: {
   *     x: number,
   *     y: number
   *   },
   *   targetDot: {
   *     x: number,
   *     y: number
   *   },
   *   radius: number,
   *   initDotMode?: 'round' | string,
   *   boundary?: {w:number,h:number},
   *   delay?: number
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
     * 是否删除
     * @type {boolean}
     */
    this.finishd = false;
    /**
     * 完成后是否
     * @type {boolean}
     */
    this.finishdRemove = false;
  }

  /**
   * 克隆
   * @return {Dot}
   */
  clone() {
    let d = new Dot({
      targetDot: {x: 0, y: 0},
      radius: 2,
      initDotMode: '',
      boundary: {w: 100, h: 100}
    });
    d.radius = this.radius;
    Object.assign(d.initDot, this.initDot)
    Object.assign(d.targetDot, this.targetDot)
    Object.assign(d.currentDot, this.currentDot)
    d.delay = this.delay;
    d.currentDot = this.currentDot;
    d.p = this.p;
    d.finishd = this.finishd;
    d.finishdRemove = this.finishdRemove;
    return d;
  }

  /**
   *  重新设置目标点
   * @param target{{x:number,y:number}}
   */
  setNewTargetDot(target) {
    Object.assign(this.initDot, this.currentDot);
    Object.assign(this.targetDot, target);
    this.p = 0;
    this.finishd = false;
    this.delayCount = 0;
  }


  /**
   * 设置初始点位置
   * @param mode{{'round' | string}}
   * @param boundary{{w:number,h:number}}
   */
  setInitDot(mode, boundary) {
    let w = boundary.w;
    let h = boundary.h;
    //随机四个角
    if (mode !== 'round') {
      this.initDot = {
        x: Math.random() > 0.5 ? w + (this.radius * 2) : -(this.radius * 2),
        y: Math.random() > 0.5 ? h + (this.radius * 2) : -(this.radius * 2)
      };
    } else {
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
    if (this.finishd || this.p === 200) {
      this.finishd = true;
      return true;
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
