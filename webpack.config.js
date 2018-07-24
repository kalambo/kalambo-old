const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.tsx',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  serve: {
    content: './dist',
  },
  mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
  plugins: [
    // new webpack.DefinePlugin({
    //   SERVER_URL: JSON.stringify(
    //     process.env.WEBPACK_SERVE
    //       ? 'http://localhost:3000'
    //       : 'https://data.kalambo.org',
    //   ),
    //   SITE_URL: JSON.stringify(
    //     process.env.WEBPACK_SERVE
    //       ? 'http://localhost:8080'
    //       : 'https://www.kalambo.org',
    //   ),
    // }),
    new webpack.DefinePlugin({
      SERVER_URL: JSON.stringify('https://data.kalambo.org'),
      SITE_URL: JSON.stringify('http://localhost:8080'),
    }),
  ],
};