export const ColorTools = {
  _HSLAColor: class {
    constructor() {
      this.s = '80%';
      this.l = '52%';
      this.h = 1;
      this.a = 0.9;
      this.factor = 2.8125; // factor = 360 / 128
      this.speed = 1;
    }

    increasingColor(s = 1) {
      this.speed += s;
      return this.getCurrentColor();
    }

    getCurrentColor() {
      if ((this.h + this.speed) * this.factor > 360) {
        this.speed = 1;
      }
      return `hsla( ${((this.h + this.speed) * this.factor)} ,${this.s} , ${this.l}, ${this.a} )`;
    }

    /**
     * 获取颜色：360-当前颜色的h值
     */
    getRelativelyColor() {
      return `hsl( ${(360 - ((this.h + this.speed - 1) * this.factor))} , ${this.s}, ${this.l} , ${this.a} )`;
    }
  },
  createHSLAColorObject() {
    return new this._HSLAColor();
  }
}
