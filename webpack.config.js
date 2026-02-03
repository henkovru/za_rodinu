const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const pretty = require('pretty');

const srcDir = path.resolve(__dirname, 'src');
const includesDir = path.resolve(__dirname, 'src/includes');
const componentsDir = path.resolve(__dirname, 'src/components');

function generatePlugins(templateDir, script, srcPrefix) {
  const dir = path.resolve(__dirname, templateDir);
  const files = fs.readdirSync(dir);
  return files
    .filter((file) => path.extname(file) === '.html')
    .map((file) => {
      const name = path.basename(file, '.html');
      return new HtmlWebpackPlugin({
        inject: script,
        scriptLoading: 'blocking',
        filename: srcPrefix ? `${srcPrefix}${name}.html` : `${name}.html`,
        template: path.resolve(dir, file),
        chunks: ['application'],
        minify: false,
      });
    });
}

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    entry: {
      application: './src/js/main.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].js',
      assetModuleFilename: 'img/[name][ext]',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.html$/i,
          include: [includesDir, componentsDir],
          use: 'raw-loader',
        },
        {
          test: /\.html$/i,
          exclude: [includesDir, componentsDir],
          use: path.resolve(__dirname, 'loaders/ejs-html-loader.js'),
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
      ...generatePlugins('src', 'body', ''),
      new CopyPlugin({
        patterns: [
          { from: 'src/img', to: 'img' },
          { from: 'src/fonts', to: 'fonts' },
        ],
      }),
      ...(isProd
        ? [new MiniCssExtractPlugin({ filename: 'css/style.css' })]
        : []),
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
