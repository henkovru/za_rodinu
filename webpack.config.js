const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const pretty = require('pretty');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
  mode: 'development',
  entry: './src/js/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[contenthash:8].js',
    assetModuleFilename: 'img/[name][ext]',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: [
          {
            loader: 'html-loader',
            options: { sources: false },
          },
          {
            loader: 'posthtml-loader',
            options: {
              ident: 'posthtml',
              plugins: [
                require('posthtml-include')({ root: path.resolve(__dirname, 'src') }),
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name][ext]' },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['main'],
      minify: false,
    }),
    new HtmlWebpackPlugin({
      template: './src/privacy.html',
      filename: 'privacy.html',
      chunks: ['main'],
      minify: false,
    }),
    new HtmlWebpackPlugin({
      template: './src/404.html',
      filename: '404.html',
      chunks: ['main'],
      minify: false,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/img', to: 'img' },
        { from: 'src/fonts', to: 'fonts' },
      ],
    }),
    ...(isProd ? [new MiniCssExtractPlugin({ filename: 'css/style.[contenthash:8].css' })] : []),
    // Форматирование HTML с переносами строк (после HtmlWebpackPlugin; emit — после добавления HTML)
    {
      apply: (compiler) => {
        compiler.hooks.emit.tap('FormatHtmlPlugin', (compilation) => {
          Object.keys(compilation.assets).forEach((filename) => {
            if (!filename.endsWith('.html')) return;
            const source = compilation.assets[filename].source();
            const formatted = pretty(source, { ocd: true });
            compilation.assets[filename] = {
              source: () => formatted,
              size: () => Buffer.byteLength(formatted, 'utf8'),
            };
          });
        });
      },
    },
  ],
  devServer: {
    static: { directory: path.join(__dirname, 'dist') },
    port: 8081,
    hot: true,
  },
};
};
