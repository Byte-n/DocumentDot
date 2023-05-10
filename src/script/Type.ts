import DocumentDot from "./DocumentDot";
import Dot from "./Dot";

export type Point = {
    x: number,
    y: number
}
export type Rect = {
    x?: number,
    y?: number,
    w: number,
    h: number
}
export type DotColor = {
    fill: (dot: Dot) => string,
    stroke: (dit: Dot) => string
}
export type RGBA = {
    r: number, g: number, b: number, a: number
}
export type DotConfig = {
    targetDot: Point,
    color: DotColor,
    initDot?: Point,
    colourful?: boolean,
    radius?: number,
    initDotMode?: DotInitMode,
    boundary?: Rect,
    delay?: number,
    rgba?: RGBA,
    ctxMode?: CtxMode,
    index?: number,
    r?: number,
    p?: number,
    pAmount: number
}
export type DocumentDotConfigCallback = {
    //callback 会在interval结束后触发
    callback: (documentDot: DocumentDot) => void,
    // one表示该回调函数在执行之后会被删除，'forever' 代表每次都会执行
    callbackType: ('one' | 'forever')
};
export type MyCanvas = {
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
}
export type DocumentDotConfig = {
    box: HTMLElement,
    canvasCount: number,
    width?: number,
    height?: number,
    callback?: DocumentDotConfigCallback,
    //是否有开场动画
    openingAnimation?: boolean,
    // 水平间距。文字水平方向的间距marginX=画板宽度-文本宽度
    marginX?: number,
    //垂直间距
    marginY?: number,
    // 默认文本大小，如果文本过大，则后面会自动效准
    fontSize?: number,
    dotConfig?: {
        // 参数为function时，如果cache为false,则函数的Dot为undefined。在初始化时，也会调用一次，传入的也是undefined
        color?: string |
            ((ctxMode: CtxMode, dot: Dot) => string)
            | {
            fill: string | ((dot: Dot) => string),
            stroke: string | ((dot: Dot) => string),
        },
        ctxMode?: CtxMode,
        colourful?: boolean,
        r?: number,
        initDotMode?: DotInitMode,
        pAmount?: number
    }
}
export type DocumentText = DocumentTextString | DocumentTextStringExtend | DocumentTextImageData;
export type DocumentTextString = string;
export type DocumentTextStringExtend = { text: DocumentTextString, fontSize?: number, initDotMode?: DotInitMode, ctxMode?: CtxMode, r?: number, color?: DotColor }
export type DocumentTextImageData = { imageData: ImageData, initDotMode?: DotInitMode, ctxMode?: CtxMode, r?: number, color?: DotColor, offset?: Point }
export type AnalyzeCanvasConfig = {
    imageData: ImageData,
    initDotMode?: DotInitMode,
    ctxMode?: CtxMode,
    r?: number,
    index?: number,
    color?: DotColor,
    offset?: Point
}

export enum CtxMode {
    Fill, FillStroke, Stroke
}

export enum DotInitMode {
    Round, Angle
}

export const DefaultDotColor: DotColor = {
    fill(_d) {
        return 'pink'
    },
    stroke(_d) {
        return 'pink'
    }
}
