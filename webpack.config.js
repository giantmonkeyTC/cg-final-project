const webpack = require("webpack");
var path = require('path');
var HtmlWebPackPlugin = require("html-webpack-plugin");
module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, 'dist')
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            }
        ]

    },
    devServer: {
        proxy: { '/api': 'http://localhost:3000' },
        compress: true,
        port: 7777
    },
    plugins: [
        new HtmlWebPackPlugin({ title: "threejs" }),
        new webpack.ProvidePlugin({ 'THREE': 'three/build/three' })
    ]
}