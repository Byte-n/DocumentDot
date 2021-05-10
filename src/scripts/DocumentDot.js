/**
 * @auhtor Byte
 * @date 2021-02-09 16:04:46
 * @description 文档粒子动画 借鉴自https://github.com/FounderIsShadowWalker/particalAniamtion
 */
class DocumentDot {
    /**
     *
     * param={
     *      canvas:canvas,           canvas 对象 或者 css选择器
     *      callback = {
     *           //callback 会在interval结束后触发
     *          callback : function(DocumentDot) {
     *              //..code
     *          },
     *          callbackType：'one',      one表示该回调函数在执行之后会被删除，'for ever'代表每次都会执行
     *          delay: 回调函数延时执行，单位ms
     *      },
     *      openingAnimation:false,      是否有开场动画
     *      marginX,                水平间距。文字水平方向的间距marginX=画板宽度-文本宽度
     *      marginY,                垂直间距
     *      fontSize,               默认文本大小，如果文本过大，则后面会自动效准
     *      illegal:{
     *          enable: boolean   是否开启非法字符提示，不开启，则会跳过非法字符（当前字体无法显示的，与设备也有关）的文档粒子动画，否则会使用text属性指定的问题替代进行动画。
     *                            备注：通常被识别为非法字符是因为当前画板无法绘制当前文本，也就是当前字体无法显示该文本！如果是字符集不支持，那么应该是乱码！如果正常字符中包括部分非法字符，则正常字符会被绘制，而非法字符不会被绘制。
     *          text:   string || {text:string,fontSize:number}    非法字符提示文本。
     *      }
     * }
     * @param param {
     *  {
     *      canvas:Element||string
     *  },
     *  {callback:
     *      {
     *      callback:function(DocumentDot),
     *      callbackType:'one'|'for ever',
     *      delay:number
     *      }
     *  },
     *  {openingAnimation:boolean},
     *  {marginX:number},{marginY:number},
     *  {fontSize:number},
     *  {illegal:{enable:boolean,text:string||{text:string,fontSize:number}}}}
     * @param texts
     */
    constructor(param, ...texts) {
        this.enabled = true
        this.canvas = $(param.canvas)[0];
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.halfWidth = this.canvas.width / 2;
        this.halfHeight = 0;

        this.resetCanvas();

        this.rafId = null;

        this.fontSize = 500;
        this.fontFamily = 'Consolas, Helvetica Neue, Helvetica, Arial, sans-serif';

        this.dotList = []
        this.historyDot = [];
        this.finish = true;
        this.textArray = [...texts];
        this.marginX = window.innerWidth / 9;
        this.marginY = window.innerHeight / 9;
        this.callback = null;
        this.illegal = {
            enable: true,
            text: {text: '字体不适配！', fontSize: 222},
        }

        this.defaultTextWhenTheTextIsIllegal = {text: '字体不适配！', fontSize: 222};
        param.callback && (this.callback = param.callback);
        param.openingAnimation === true && this._openingAnimation();
        !isNaN(param.marginX) && (this.marginX = param.marginX);
        !isNaN(param.marginY) && (this.marginY = param.marginY);
        !isNaN(param.fontSize) && (this.fontSize = param.fontSize);
        (typeof param.illegal === 'object') && (Object.assign(this.illegal, param.illegal));
    }

    _openingAnimation() {
        let fs = this.fontSize;
        this.dotList = [new Dot(0, 0, 2),
            new Dot(0, window.innerHeight, 2),
            new Dot(window.innerWidth, 0, 2),
            new Dot(window.innerWidth, window.innerHeight, 2)
        ]
        this.fontSize = 88;
        this._emitDot('.');
        this.fontSize = fs;
    }

    resetCanvas() {
        this.ctx.textBaseline = "top";
        this.ctx.fillStyle = "#fff";
    }

    _push(text) {
        if (text.length === 0) return false;
        this.textArray.push(text);
        return true;
    }

    /**
     * 开始动画
     */
    animation() {
        let self = this;
        this.interval = setInterval(function () {
            if (self.textArray.length === 0) {
                //等待完成
                if (self.finish) {
                    clearInterval(self.interval);
                    self.interval = null;
                    if (self.callback != null && self.callback.callback instanceof Function) {
                        setTimeout(function () {
                            self.callback.callback(self);
                            if (self.callback.callbackType === 'one') {
                                self.callback = null;
                            }
                        }, self.callback.delay ? self.callback.delay : 0);
                    } else {
                        self.callback = null;
                    }
                }
                return;
            }
            if (self.finish === true) {
                self._emitDot(self.textArray.shift());
            }
        }, 30);
    }

    /**
     * 添加一个文本到队列中，如果队列为空，则会自动开始动画
     * @param texts
     */
    emitDot(...texts) {
        let is = false;
        //key是数组的索引
        for (const key in texts) {
            is = this._push(texts[key]);
        }
        is && this.interval === null && this.animation();
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
        let text;
        let fontSize_ = this.fontSize;
        if (typeof param === 'object') {
            text = param.text.trim();
            if (!isNaN(param.fontSize)) {
                fontSize_ = param.fontSize
            }
        } else if (typeof param === 'string') {
            text = param.trim();
        } else if (typeof param === 'function') {
            text = param().trim();
        } else {
            text = 'NULL';
        }

        if (this.rafId) cancelAnimationFrame(this.rafId);

        let strings = text.split('\n');
        let length = strings.length > 1 ? 2 : 1, fs;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < length; i++) {
            text = strings[i];
            //字体大小优化
            this.setFontSize(fontSize_);
            fontSize_ = Math.min(fontSize_,
                ((this.canvas.width - this.marginX) / this.ctx.measureText(text).width) * fontSize_,
                ((this.canvas.height - this.marginY) / fontSize_) * (this.isNumber(text) ? 1 : 0.5) * fontSize_);
            this.setFontSize(fontSize_);
            if (length === 2) {
                this.halfHeight = this.canvas.height / 2 - (fontSize_ * (1 - i));
            } else {
                this.halfHeight = this.canvas.height / 2 - (fontSize_ / 2);
            }
            this.ctx.fillText(text, this.canvas.width / 2 - this.ctx.measureText(text).width / 2, this.halfHeight);
        }


        this.historyDot = this.dotList;
        this.dotList = [];
        this.handleCanvas();
        //初始化失败重新来
        if (this.dotList.length === 0) {
            //重置，不然dotList就是空数组
            this.dotList = this.historyDot;
            if (this.illegal.enable === true) {
                //避免提示字符也是非法字符
                let t = (typeof this.illegal.text === 'object') ? this.illegal.text.text
                    : ((typeof this.illegal.text === 'function') ? this.illegal.text() : this.illegal.text);
                this.textArray.unshift(t === text ? this.defaultTextWhenTheTextIsIllegal : this.illegal.text);
            } else {
                //可以不用清空画板？因为按理来说，如果docList为空，则画板上应该没有像素被绘制
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.finish = true;
            return;
        } else {
            this.finish = false;
        }
        this._draw();
    }

    setFontSize(fontSize) {
        this.ctx.font = fontSize + 'px ' + this.fontFamily;
    }

    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    handleCanvas() {
        let m = Math.random();
        let imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        for (let x = 0; x < imgData.width; x += 6) {
            for (let y = 0; y < imgData.height; y += 6) {
                let i = (y * imgData.width + x) * 4;
                if (imgData.data[i + 3] > 128 && imgData.data[i] > 250 && (imgData[i] === imgData[i + 1] && imgData[i + 1] === imgData[i + 2])) {
                    this.dotList.push(new Dot(x, y, 2, m));
                }
            }
        }
    }

    easeInOutCubic(t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b;
    }

    _draw() {
        let finisCount_ = 0, len = this.dotList.length;
        //如果当前粒子的数组为空，那么历史数组的粒子就找不到动画的目的地
        if (len === 0) {//如果historyDot为空，则什么都不会绘制，如果historyDot不为空，则继续绘制就会出现异常（因为dotList为空）
            //_emitDot中做了处理，所有正常情况下不会到这里来
            this.finish = true;
            return;
        }
        let curDot = null, frameNum, frameCount, curX, curY, hisLen = this.historyDot.length;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < len; i++) {
            curDot = this.dotList[i];
            frameNum = curDot.frameNum;
            frameCount = curDot.frameCount;
            if (curDot.delayCount < curDot.delay) {
                curDot.delayCount++;
                continue;
            }
            this.ctx.save();
            this.ctx.beginPath();
            if (frameNum < frameCount) {
                if (hisLen < len) {//当历史粒子小于所需要的粒子时，就绘制新粒子的运动（从出生点到目标点）
                    curX = this.easeInOutCubic(frameNum, curDot.sx, curDot.x - curDot.sx, curDot.frameCount);
                    curY = this.easeInOutCubic(frameNum, curDot.sy, curDot.y - curDot.sy, curDot.frameCount);
                    this.ctx.arc(curX, curY, curDot.radius, 0, 2 * Math.PI);
                }
                curDot.frameNum += 1;
            } else {
                finisCount_++;
                this.ctx.arc(curDot.x, curDot.y, curDot.radius, 0, 2 * Math.PI);
            }
            this.ctx.fill();
            this.ctx.restore();
        }

        //如果已经完成绘制
        if (this.finish) {
            return;
        }
        //不支持的字符时 dotList为空？

        //历史粒子
        let tempArr = [];
        //已到达目的地的历史粒子数量
        let x, y, cd, finisCount = 0;
        for (let i = 0; i < hisLen; i++) {
            this.ctx.save();
            this.ctx.beginPath();
            // this.ctx.fillStyle = "rgba(210,8,8,0.64)";
            let hd = this.historyDot[i];
            if (hd.finis) {
                finisCount++;
                continue;
            }
            //通过splice方式，尽量确保"雨露均沾"
            if (tempArr.length === 0) {
                if (this.dotList.length === 0) {
                    continue;
                }
                Object.assign(tempArr, this.dotList);
            }
            cd = hd.dot || tempArr.splice(~~(tempArr.length * Math.random()), 1)[0];
            x = this.easeInOutCubic(cd.frameNum, hd.x, cd.x - hd.x, cd.frameCount);
            y = this.easeInOutCubic(cd.frameNum, hd.y, cd.y - hd.y, cd.frameCount);
            if (x - cd.x === 0 && y - cd.y === 0) {
                hd.finis = true;
            }
            hd.frameNum++;
            hd.dot = cd;
            this.ctx.arc(x, y, cd.radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.restore();
        }
        //判断动画是否完成: historyDot和dotList都完成
        if (finisCount === hisLen && finisCount_ === len) {
            this.historyDot = [];
            this.finish = true;
        }
        this.rafId = window.requestAnimationFrame(this._draw.bind(this));
    }

    start(){
      this.enabled=true;
      this._draw();
    }
    stop(){
      this.enabled = false;
      window.cancelAnimationFrame(this.rafId);
    }

}

class Dot {
    constructor(centerX, centerY, radius, startPointMode = 0.6) {
        this.x = centerX;
        this.y = centerY;
        this.radius = radius;
        this.frameNum = 0;
        this.frameCount = Math.ceil(3000 / 16.66);
        //固定点涌出
        // this.sx = halfWidth;
        // this.sy = window.innerHeight / 2;
        //随机四个角
        if (startPointMode < 0.5) {
            this.sx = Math.random() > 0.5 ? window.innerWidth + (this.radius * 2) : -(this.radius * 2);
            this.sy = Math.random() > 0.5 ? window.innerHeight + (this.radius * 2) : -(this.radius * 2);
        } else {
            //四周
            if (Math.random() > 0.5) {
                this.sx = Math.random() > 0.5 ? window.innerWidth + (this.radius * 2) : -(this.radius * 2);
                this.sy = Math.random() * window.innerHeight;
            } else {
                this.sx = Math.random() * window.innerWidth;
                this.sy = Math.random() > 0.5 ? window.innerHeight + (this.radius * 2) : -(this.radius * 2);
            }

        }
        this.delay = this.frameCount * Math.random();
        this.delayCount = 0;
        this.opacity = Math.random();
    }
}

export default DocumentDot;
