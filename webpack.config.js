const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

// Load client environment variables
require('dotenv').config({ path: path.resolve(__dirname, 'client/.env') });

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_API_BASE_URL',
  'REACT_APP_TIMEOUT',
  'REACT_APP_DEBUG',
  'REACT_APP_ENABLE_AUDIT_LOG',
  'REACT_APP_ENABLE_DOMAIN_MANAGEMENT'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('[ERROR] Missing required environment variables:', missingVars);
  console.error('[ERROR] Please set these variables in your client/.env file');
  process.exit(1);
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './client/src/App.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: 'defaults',
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic'
                }],
                '@babel/preset-typescript'
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'client/src'),
        '@/components': path.resolve(__dirname, 'client/src/components'),
        '@/types': path.resolve(__dirname, 'client/src/types'),
        '@/utils': path.resolve(__dirname, 'client/src/utils'),
        '@/hooks': path.resolve(__dirname, 'client/src/hooks'),
        '@/services': path.resolve(__dirname, 'client/src/services')
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './client/public/index.html',
        filename: 'index.html'
      }),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          NODE_ENV: process.env.NODE_ENV,
          REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
          REACT_APP_TIMEOUT: process.env.REACT_APP_TIMEOUT,
          REACT_APP_DEBUG: process.env.REACT_APP_DEBUG,
          REACT_APP_ENABLE_AUDIT_LOG: process.env.REACT_APP_ENABLE_AUDIT_LOG,
          REACT_APP_ENABLE_DOMAIN_MANAGEMENT: process.env.REACT_APP_ENABLE_DOMAIN_MANAGEMENT,
        })
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3001,
      hot: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      },
      historyApiFallback: true
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
}; 