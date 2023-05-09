// 官方文档 ： https://webpack.docschina.org/guides/
//压缩js
const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');
// 是否是 开发 模式
const devMode = process.env.NODE_ENV !== "production";

const srcDir = path.resolve(__dirname, './src/');
console.log('devMode',devMode, process.env.NODE_ENV)
const config = {
  mode: devMode?'development':'production',
  devtool: false,
  entry: {
    'index': path.join(srcDir, 'lib-index.ts')
  },
  output: {
    path: path.resolve(__dirname, 'dist-lib'),
    filename: 'index.js',
    library: {
      name: 'DocumentDots',
      type: 'umd',
    },
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
    ]
  },
  optimization: {
    minimizer: [
      // 压缩 JS
      new TerserPlugin({
        extractComments: false//是否生成*.js.LICENSE.txt文件
      })
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  }
};
module.exports = config;
