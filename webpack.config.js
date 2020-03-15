const path = require('path')

const config = []

production = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'mini-pjax.js'
  }
}

config.push(production)

development = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'example/js'),
    filename: 'mini-pjax.js'
  }
}

if (process.env.WEBPACK_MODE !== 'production') {
  config.push(development)
}

module.exports = config
