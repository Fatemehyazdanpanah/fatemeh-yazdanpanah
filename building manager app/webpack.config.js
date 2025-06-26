const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    base: './assets/js/base.js',
  },
  output: {
    path: path.resolve(__dirname, './assets/dist'),
    filename: 'js/[name]-bundle.js',
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(jpe?g|png)$/i,
        use: [
          {
            loader: 'responsive-loader',
            options: {
              adapter: require('responsive-loader/sharp'),
              sizes: [180, 300, 600, 1200],
              placeholder: true,
              placeholderSize: 30,
              name: 'img/[name]-[width].[ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name]-bundle.css',
    }),
  ],
  devtool: 'source-map',
  devServer: {
    static: [
      { directory: path.resolve(__dirname, 'pages'), watch: true },
      { directory: path.resolve(__dirname, 'assets/img'), watch: true },
      { directory: path.resolve(__dirname, 'assets/dist'), watch: true },
    ],
    compress: true,
    port: 3000,
    hot: true,
    open: true,
    liveReload: true,
  },
};
