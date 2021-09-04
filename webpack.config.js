let webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');
const CleanCSS = require('clean-css');

let distPath = __dirname + '/dist';

module.exports = {
    entry: { // 需要被打包的js文件路径及文件名
            './scripts/index': './src/scripts/index.js'
    },
    output: {
        path: distPath,    // 打包输出的目标文件的绝对路径（其中__dirname为当前目录的绝对路径）
        filename: '[name].js'   // 打包输出的js文件名及相对于dist目录所在路径
    },
    module: {
        rules: [
            // {
            //     test: /\.css$/,   // 正则表达式，表示.css后缀的文件
            //     use: ['style-loader', 'css-loader']   // 针对css文件使用的loader，注意有先后顺序，数组项越靠后越先执行
            // },
            {
                test: /\.(png|jpg|gif|svg|webp)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'images/[name].[ext]'
                    }
                },

            }
        ]
    },
    // 本地服务器 webpack-dev-server插件，开发中server，便于开发，可以热加载
    devServer: {
        contentBase: '/dist',  //默认本地服务器所在的根目录
        historyApiFallback: true,   //是否跳转到index.html
        inline: true,   //源文件改变时刷新页面
        // port: 8086, //端口号，默认8080
        index: "index.html" // 服务器主页名称
    },
    plugins: [
        new htmlWebpackPlugin({ //输出html文件1
            // title: '123',   //生成html文件的标题
            // favicon: './favicon.png',   //生成html文件的favicon的路径
            filename: './index.html',     //生成html文件的文件名，默认是index.html
            template: './src/index.html',     //本地html文件模板的地址
            // hash: true,
            chunks: ['./scripts/index'] // 与entry 出对应的键值对的Key一致
        }),
        //静态文件处理
        new CopyWebpackPlugin([
            {
                from: __dirname + '/src/css',
                to: 'css',
                ignore: ['*.less', '*.css.map'],
                transform(content, absoluteFrom) {
                    // 打包CSS 时，压缩CSS
                    return new CleanCSS({level: 1}).minify(content).styles;
                }
            }
        ]),
        new CopyWebpackPlugin([
            {
                from: __dirname + '/src/res',
                to: 'res'
            }
        ])
    ]
};