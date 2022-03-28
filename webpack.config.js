// 官方文档 ： https://webpack.docschina.org/guides/
// const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const CleanCSS = require('clean-css');
//压缩js
const TerserPlugin = require('terser-webpack-plugin');
// 压缩 cs
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// 以link的方式引入css
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const path = require('path');
// 是否是 开发 模式
const devMode = process.env.NODE_ENV !== "production";

const srcDir = path.resolve(__dirname, './src/');
const distDir = path.resolve(__dirname, './dist/');
// 打包less变为css时的文件夹； dist/css/
const cssDir = './css/';
console.log('devMode',devMode, process.env.NODE_ENV)
const config = {
  mode: devMode?'development':'production',
  devtool: 'inline-source-map',
  entry: {
    'index': path.join(srcDir, 'index.ts')
  },
  output: {
    path: distDir,
    filename: '[name].js',
  },
  devServer: {
    static: { // 静态资源目录
      directory: distDir,
      serveIndex: true,
    },
    hot: false, // true | false | 'only' // 热模块替换特性 //启用热模块替换功能，在构建失败时不刷新页面作为回退，使用 hot: 'only'
    liveReload: true,  // 页面刷新 与hot 两个只能启用一个
    port: 8081,
    client: {
      overlay: {
        errors: false,
        warnings: false,
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          //分离css以后，就会通过外链的方式引入页面，所以之前的'style-loader'就不需要了。
          MiniCssExtractPlugin.loader,
          "css-loader"
        ],
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      // 输出到 output.path 下面的 css中
      filename: cssDir+"[name].css",		//MiniCssExtractPlugin.loader分离出来的CSS存放的目录,
      ignoreOrder: false, // Enable to remove warnings about conflicting order
    }),
    new HtmlWebpackPlugin({
      filename: path.join(distDir, 'index.html'),
      template: path.join(srcDir, 'index.html'),
      chunks: ['index']
    }),
    new CopyWebpackPlugin({
      patterns: [
        /*{
          from: path.join(src, 'css/'),
          to: path.join(dist, 'css/'),
          /!*transform(content, _absoluteFrom) {
            // 打包CSS 时，压缩CSS
            return new CleanCSS({level: 1}).minify(content).styles;
          },*!/
          transform: {
            transformer(content, path) {
              // 打包CSS 时，压缩CSS
              return new CleanCSS({level: 1}).minify(content).styles;
            },
            cache: true,
          },
          globOptions: {
            ignore: ['**!/!*.less', '**!/!*.css.map'],
          },
          info: {minimized: true},
        },*/
        {
          from: path.join(srcDir, 'res/'),
          to: path.join(distDir, 'res/'),
        },
      ],
    })
  ],
  optimization: {
    minimizer: [
      // 压缩 CS
      new CssMinimizerPlugin(),
      // 压缩 JS
      new TerserPlugin({
        extractComments: false//是否生成*.js.LICENSE.txt文件
      })
    ],
    // minimize: true,// 生产环境也启用压缩
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  }
};
//devServer.hot=true 会实现下列操作
// if (devMode) {
//   config.plugins.push(
//     new webpack.HotModuleReplacementPlugin({
//       // Options...
//     })
//   )
// }
module.exports = config;