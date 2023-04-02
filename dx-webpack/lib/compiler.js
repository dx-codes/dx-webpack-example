const path = require('path')
const fs = require('fs')
const ejs = require('ejs')
const babylon = require('babylon')
const types = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default

class Compiler {
  constructor(config) {
    this.config = config // webpack.config.js { entry, output: { filename, path } }
    this.rootPath = process.cwd() // 项目根目录在磁盘上的绝对路径
    this.entryId = null // 入口文件标识，一般是./src/index.js
    this.modules = {} // 保存所有解析完成的module
    this.assets = {}

  }

  run() {
    const entryPath = path.resolve(this.rootPath, this.config.entry)
    this.buildModule(entryPath, true)
    this.emitFile()
  }

  // modulePath为绝对路径
  buildModule(modulePath, isEntry) {
    const source = this.getSource(modulePath)
    const moduleName = './' + path.relative(this.rootPath, modulePath)

    if (isEntry) {
      this.entryId = moduleName
    }

    const { sourceCode, dependencies } = this.parse(source, path.dirname(moduleName))
    this.modules[moduleName] = sourceCode

    // string数组，就是路径的集合
    dependencies.forEach(dep => {
      this.buildModule(path.join(this.rootPath, dep), false)
    })
  }

  getSource(modulePath) {
    return fs.readFileSync(modulePath, 'utf-8')
  }

  parse(source, parentPath) {
    const dependencies = []

    const ast = babylon.parse(source)
    traverse(ast, {
      CallExpression(exp) {
        const node = exp.node

        if (node.callee.name === 'require') {
          console.log('========== parse require start ==========')
          node.callee.name = '__webpack_require__' // 把require换成__webpack_require__
          
          let moduleName = node.arguments[0].value
          console.log('1 -> ', moduleName)
          moduleName = moduleName + (path.extname(moduleName) ? '' : '.js') // 拼接后缀名
          console.log('2 -> ', moduleName)
          moduleName = './' + path.join(parentPath, moduleName) // 拼接相对路径
          console.log('3 -> ', moduleName)

          dependencies.push(moduleName)
          node.arguments = [types.stringLiteral(moduleName)] // 把更新后的路径写回源码

          console.log('========== parse require end ============')
        }
      }
    })

    const sourceCode = generator(ast).code
    console.log('sourceCode -> \n', sourceCode)

    return { sourceCode, dependencies }
  }

  emitFile() {
    const entryId = this.entryId
    const modules = this.modules
    const outputPath = this.config.output.path
    const filename = this.config.output.filename

    const result = ejs.render(this.getSource(path.resolve(__dirname, 'template.ejs')), { entryId, modules })
    console.log(result)

    const outputFilename = path.join(outputPath, filename)
    this.assets[outputFilename] = result
    fs.writeFileSync(outputFilename, result)
  }
}

module.exports = Compiler