#! /usr/bin/env node

console.log('dx-webpack start')

const path = require('path')
const { Compiler } = require('../lib')
const config = require(path.resolve('webpack.config.js'))

const compiler = new Compiler(config)
compiler.run()

// const entryId = compiler.entryId
// const modules = compiler.modules

// console.log(__dirname)
// ejs.renderFile(path.resolve(__dirname, '..', 'lib', 'template.ejs'), { entryId, modules }).then(res => {
//   console.log(res)
//   fs.writeFileSync()
// })