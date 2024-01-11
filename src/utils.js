import * as Mime from 'mime/lite'

const CustomMaps = {
  'image/*': ['jpeg', 'png', 'gif'],
}

function AttributeBoolean(key) {
  key = key instanceof Array ? key : [key]
  return function () {
    return key.some((k) => ['', true, 'true'].includes(this.$attrs[k]))
  }
}

function BytesToSize(bytes) {
  let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

function GetFileExtensions(accept) {
  if (!accept) return []
  return accept
    .split(',')
    .map((v) => v.trim())
    .map((v) => {
      if (v.startsWith('.')) return v.substring(1)
      if (v in CustomMaps) return CustomMaps[v]
      return Mime.getExtension(v)
    })
    .flat()
}

function IsAccepted(file, accept, options = { fromDirectory: false }) {
  const { fromDirectory } = options

  //folder don`t have type but if items is from a directory ->  accept
  if (accept === 'directory' && (fromDirectory || !file.type)) return true

  if (!file.type && !accept) return false
  if (!accept) return true

  return accept
    .split(',')
    .map((v) => v.trim())
    .some((v) => {
      if (v.startsWith('.')) {
        let type = Mime.getType(v.substring(1))
        return type === file.type
      }
      if (v.includes('*')) return file.type.startsWith(v.replace('*', ''))
      return file.type === v
    })
}

function Clone(val) {
  return JSON.parse(JSON.stringify(val))
}

export { AttributeBoolean, BytesToSize, Clone, IsAccepted, GetFileExtensions }
