//webpack.config.js
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    'infimo': './src/main.ts',
    'infimo.min': './src/main.ts'
  },
  output: {
    path: path.resolve(__dirname, '_bundles'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'Infimo',
    umdNamedDefine: true
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new UglifyJsPlugin({
      sourceMap: true,
      include: /\.min\.js$/,
    }),
    new NodePolyfillPlugin({
			includeAliases: ['vm']
		})
  ],
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      exclude: /node_modules/,
    }]
  }
};