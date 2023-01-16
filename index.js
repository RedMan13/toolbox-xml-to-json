const fs = require('fs')
const convert = require('xml-js')
const beautify = require('json-beautify')

// IMPORTANT: there has to be a file named cat.xml wich contains a valid xml in the exact same place as this

let category = false
const parseBlocks = (block, inside) => {
  let json = {
    type: block.attributes.type
  }
  if (!inside) json.kind = 'block'
  if (!block.elements) return json
  const elements = block.elements
  elements.forEach(x => {
    switch (x.name) {
      case 'field': {
        if (!json.fields) json.fields = {}
        json.fields[x.attributes.name] = !x.elements ? '' : x.elements[0].text
        break
      }
      case 'value': {
        if (!json.inputs) json.inputs = {}
        json.inputs[x.attributes.name] = {}
        json.inputs[x.attributes.name][x.elements[0].name] = parseBlocks(x.elements[0], true)
      }
    }
  })
  return json
}


const parseElms = (elements) => {
  let returned = [];
  elements.forEach((element) => {
    switch (element.name) {
      case 'category': {
        category = true
        let out = {
          kind: 'category',
          name: element.attributes.name,
          colour: element.attributes.colour
        }
        if (element.attributes['css-icon']) {
          out.cssConfig = {}
          out.cssConfig.icon = element.attributes['css-icon']
        }
        if (element.attributes.custom) out.costom = element.attributes.custom
        if (element.elements) {
          out.contents = parseElms(element.elements)
        }
        returned.push(out)
        break
      }
      case 'label': {
        if (element.attributes.text == '' || element.attributes.text == 'ㅤ') {
          returned.push({
            "kind": "sep",
            "gap": "32"
          })
          break
        }
        returned.push({
          kind: 'label',
          text: element.attributes.text,
          'web-class': element.attributes['web-class']
        })
        break
      }
      case 'button': {
        returned.push({
          kind: 'button',
          text: element.attributes.text,
          callbackKey: element.attributes.callbackKey
        })
        break
      }
      case 'block': {
        returned.push(parseBlocks(element, false))
        break
      }
      case 'sep': {
        returned.push({
          kind: 'sep'
        })
        break
      }
    }
  })
  return returned
}

fs.readFile('toolbox.xml', (err, file) => {
  if (err) throw err
  file = file.toString('utf8')
  let json = convert.xml2json(file, { compact: false, ignoreComment: true, spaces: 4 })
  json = JSON.parse(json)
  fs.writeFile('toolbox.json', Buffer.from(beautify({
    "kind": category ? "categoryToolbox" : "flyoutToolbox",
    "contents": parseElms(json.elements[0].elements)
  }, null, 4)), () => { })
})