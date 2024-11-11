import path from 'path';

const randomSignatureKey = function (len) {  
  len = len || 32; 
  let chars = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghigklmnopqrstuvwxyz1234567890'; 
  let maxPos = chars.length; let signatureKey = ''; 
  for (let i = 0; i < len; i++) { 
    signatureKey += chars.charAt(Math.floor(Math.random() * maxPos)); 
  } 
  signatureKey = moment().format('YYYYMMDDTHHmmss') + signatureKey
  return signatureKey; 
};

const getDurPlayerUrl = function (url, stime, stime_step) {
  let num = Math.floor((Math.random()*20)+1),
  unque = randomSignatureKey (num)
  let newUrl = `${url}?stime=${stime}&dur=${stime_step}&unique=${unque}`
  return newUrl
}

const getPlayerUrl = function (url, dataVal) {
  let num = Math.floor((Math.random()*20)+1),
  unque = randomSignatureKey (num)
  let newVal = dataVal
  let newUrl = `${url}?timeshift=${newVal}&unique=${unque}`
  return newUrl
}

const calculationFormat = function (val) {
  let hour, minut, second
  hour = parseInt(val / (60*60*1000))
  val -= hour*60*60*1000
  minut = parseInt(val / (60*1000))
  val -= minut*60*1000
  second = parseInt(val / 1000)
  if (hour < 10) {
    hour = '0' + hour
  }
  if (minut < 10) {
    minut = '0' + minut
  }
  if (second < 10) {
    second = '0' + second
  }
  return `${hour}:${minut}:${second}`
}

const fileParse = function (val) {
  const REG_GROUP = /^\s*\[(.+?)\]\s*$/
  const REG_PROP = /^\s*([^#].*?)\s*=\s*(.*?)\s*$/
  let object = {}
  let lines = val.split('\n')
  let group
  let match
  let lastMatch

  for(var i = 0, len = lines.length; i !== len; i++){
    if(match = lines[i].match(REG_GROUP)) {
      lastMatch = match[1]
      if (object[match[1]]) {
        let val = object[match[1]]
        if (!Array.isArray(val)) {
          val = [val]
        }
        object[match[1]] = [...val]
        object[match[1]].push(group)
        group = {}
      }else {
        object[match[1]] = group = object[match[1]] || {};
      }
    }
    else if(group && (match = lines[i].match(REG_PROP))) {
      group[match[1]] = match[2];
    }
  }
  if (!object[lastMatch][0]) {
    object[lastMatch] = []
  }
  object[lastMatch].push(group);
  return object;
}

// 计算切片绝对时间和偏移量
const calcOffset = function (player, hls, nowTime) {
  let pointList = null,
  medialist = hls.levels[0].details.fragments
  for (let key of medialist) {
    let mtnum = key.programDateTime
    if (nowTime >= mtnum) {
      pointList = mtnum
    }
  }
  if (pointList == null) {
    return {
      time_slice: moment(nowTime).format('YYYYMMDDTHHmmss'),
      time_offset: 0
    }
  }else {
    return {
      time_slice: moment(pointList).format('YYYYMMDDTHHmmss'),
      time_offset: nowTime - pointList
    }
  }
}

// 格式化分秒毫秒时长
const controlForamtTime = function (val) {
  let fileter_val = val
  if (typeof fileter_val == 'string') {
    if (val.includes(':')) {
      let valArry = fileter_val.split(':')
      valArry = valArry.map((value) => {
         return parseInt(value)
      })
      fileter_val = (valArry[0] || 0) * 60 + (valArry[1] || 0) + (valArry[2] || 0) / 100
    }
    if (val.includes('.')) {
      fileter_val = +val
    }
  }
  let divisor = parseInt(fileter_val / 60), remainder = parseInt(fileter_val % 60)
  let hour = parseInt(divisor / 60)
  hour = hour < 10 ? `0${hour}` : hour
  divisor = parseInt(divisor % 60)
  let minut = divisor < 10 ? `0${divisor}` : divisor,
  millisecond = String((+fileter_val).toFixed(3)).replace(/^[0-9]+./i, ''),
  second = remainder < 10 ? `0${remainder}` : remainder
  return `${hour}:${minut}:${second}.${millisecond}`
}

// 替换URL中的location
const urlFormat = function (val) {
  let url = ''
  if (process.env.NODE_ENV == 'development') {
    url = val.replace(/\${location_host}/g, 'euvptest.icbtlive.com')
    .replace(/\${location_hostname}/g, 'euvptest.icbtlive.com' )
    // url = val.replace(/\${location_host}/g, '192.168.1.20')
    // .replace(/\${location_hostname}/g, '192.168.1.20' )
    // url = val.replace(/\${location_host}/g, '116.228.243.178:8022')
    // .replace(/\${location_hostname}/g, '116.228.243.178:8022' )
    // url = val.replace(/\${location_host}/g, '47.99.15.95:4102')
    // .replace(/\${location_hostname}/g, '47.99.15.95:4102' )
    // url = val.replace(/\${location_host}/g, '112.126.14.147')
    // .replace(/\${location_hostname}/g, '112.126.14.147' )
  }else {
    url = val.replace(/\${location_host}/g, window.location.host)
    .replace(/\${location_hostname}/g, window.location.hostname )
  }
  return url
}
// 数字前面填充00
const paddingZero = function (val, length) {
  for(var len = (val + "").length; len < length; len = val.length) {
      val = "0" + val;            
  }
  return val;
}

// 全屏处理逻辑
const FullScreen = function () {
  let docElm = document.documentElement;
  if (isFullscreen ()) {
    //W3C
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
    //FireFox
    else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    //Chrome等
    else if (document.webkitCancelFullScreen) {
      document.webkitCancelFullScreen();
    }
    //IE11
    else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }else {
    //W3C
    if(docElm.requestFullscreen) {
      docElm.requestFullscreen();
    }

    //FireFox
    else if(docElm.mozRequestFullScreen) {
      docElm.mozRequestFullScreen();
    }

    //Chrome等
    else if(docElm.webkitRequestFullScreen) {
      docElm.webkitRequestFullScreen();
    }

    //IE11
    else if(elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
  function isFullscreen () {
    return document.fullscreenElement    ||
      document.msFullscreenElement  ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement || false;
  }
}

// 色彩值换算
const colorFormat = function (value, type) {
  if (type == 'hue') {
    if (value < 0) {
      value = -((+Math.pow(10, Math.abs(value)/100).toFixed(2)) - 1.0)
    } else {
      value = +Math.pow(10, value/100).toFixed(2) - 1.0
    }
    value = +value.toFixed(2)
  }else {
    value = +Math.pow(10, value/100).toFixed(2)
  }
  return value
}
/**
 * This is just a simple version of deep copy
 * @param {Object} source
 * @returns {Object}
 */
// 深度拷贝函数
const deepCopy = (source) => {
  if (!source || typeof source !== 'object') {
    throw new Error('error');
  }
  const targetObj = source.constructor === Array ? [] : {};
  for (const keys in source) {
    if (source.hasOwnProperty(keys)) {
      if (source[keys] && typeof source[keys] === 'object') {
        targetObj[keys] = source[keys].constructor === Array ? [] : {};
        targetObj[keys] = deepCopy(source[keys]);
      } else {
        targetObj[keys] = source[keys];
      }
    }
  }
  return targetObj;
}

const fileDuration = (file) => {
  if (file) {
    let duration = file.properties.format.duration
    if (!duration && file.info && file.info.dst_trans 
      && file.info.dst_trans.duration) {
      duration = file.info.dst_trans.duration
    }
    return duration
  }
}
// 16进制字符串  => 10进制
const hex2int = function(hex) {
  var len = hex.length, a = new Array(len), code;
  for (var i = 0; i < len; i++) {
      code = hex.charCodeAt(i);
      if (48<=code && code < 58) {
          code -= 48;
      } else {
          code = (code & 0xdf) - 65 + 10;
      }
      a[i] = code;
  }
  
  return a.reduce(function(acc, c) {
      acc = 16 * acc + c;
      return acc;
  }, 0);
}

// 时分秒 => 毫秒数

const timeStamp = function(timeStr) {
  let strArry = timeStr.split(':'),
  millisecond_arry = strArry[2].split('.')
  return moment.duration ({
    millisecond: +((+millisecond_arry[1]).toFixed(3)),
    seconds: +millisecond_arry[0],
    minutes: +strArry[1],
    hours: +strArry[0],
  })
}

// 时间微调 - 秒进行40的倍数处理
const timeTuning = (time) => {
  let t1 = parseInt(time * 1000)
  let t2 = Math.floor(t1 / 40)
  let t3 = t1 % 40;
  if (t3 == 0) {
    return time
  }else {
    let t4 = t3 >= 20 ? (t2 + 1) * 40 : (t2 - 1) * 40 // 40的倍数-过半舍入
    return Number((t4 / 1000).toFixed(3))
  }
}
// 解析编目信息显示
const parseProgram = (mediaData) => {
  let obj = {}, media_info = mediaData.other_info.task_info,
  sort_obj = {
    '节目名称': '',
    '节目类型': '',
    '栏目': '',
    '子类别': '',
    '标签': '',
    '关键字': '',
    '简介': '',
    '出品年代': '',
    '语言': '',
    '发行地区': '',
    '导演': '',
    '演员': '',
    '片头': '',
    '片尾': '',
    '输出格式': '',
    '编码模板': '',
    '优先级': '',
    '分段合并': '',
    '自动上传': '',
  }
  if (media_info) {
    for (let [key, value] of Object.entries(media_info)) {
      switch (key) {
        case 'program_name': 
          obj['节目名称'] = value
          break;
        case 'program_type': 
          obj['节目类型'] = value
        break;
        case 'program_flog': 
          obj['关键字'] = value
        break;
        case 'program_description': 
          obj['简介'] = value
        break;
        case 'other_info': 
          if (media_info.other_info) {
            for (let [info_key, info_value] of Object.entries(media_info.other_info)) {
              switch (info_key) {
                case 'tag':
                  obj['标签'] = info_value
                  break;
                case 'genre':
                  obj['子类别'] = info_value
                  break;
                case 'level':
                  obj['优先级'] = info_value
                  break;
                case 'merge':
                  obj['分段合并'] = info_value ? '合并' : '分段'
                  break;
                case 'category':
                  obj['栏目'] = info_value
                  break;
                case 'file_title':
                  obj['片头'] = info_value.name
                  break;
                case 'file_end':
                  obj['片尾'] = info_value.name
                  break;
                case 'autoUpload':
                  obj['自动上传'] = info_value ? 'AMS' : ''
                  break;
                default:
                  break;
              }
            }
          }
        break;
        default:
          break;
      }
    }
    for (let [key, value] of Object.entries(sort_obj)) {
      if (obj[key]) {
        sort_obj[key] = obj[key]
      }else {
        delete sort_obj[key]
      }
    }
    if (mediaData.program) {
      sort_obj['节目类型'] = mediaData.program.name
    }
    if (mediaData.chlid_program) {
      sort_obj['栏目'] = mediaData.chlid_program.name
    }
    return sort_obj
  }else {
    return null
  }
}

// rgba转换为16进制
const colorHex = (color) => {
  let colorArry = color.match(/(\d(\.\d+)?)+/g),
  strHex = '0x'
  for (let [index, value] of colorArry.entries()) {
    let hex = ''
    if (index == (colorArry.length - 1)) {
      hex = (Number(value) * 255).toString(16)
    }else {
      hex = Number(value).toString(16)
    }
    if (hex.length < 2) {
      hex = hex.padStart(2, '0')
    }
    strHex += hex;
  }
  return strHex;
}

const downloadFileByBase64 = (url, fileName) => {
  /**创建一个a标签，并做下载点击事件*/
  function downloadFile(hrefUrl){
    let a = document.createElement("a")
    a.setAttribute("href",hrefUrl)
    a.setAttribute("download",fileName)
    let clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    })
    a.dispatchEvent(clickEvent);
  }

  downloadFile(url);

  /**下载文件的方法*/

  // const xhr = new XMLHttpRequest();
  // xhr.open('get', url, true);
  // xhr.responseType = 'blob'; // ""|"text"-字符串 "blob"-Blob对象 "arraybuffer"-ArrayBuffer对象
  // xhr.onload = function() {
  //   downloadFile(URL.createObjectURL(xhr.response));
  // };
  // xhr.send();

}
/**
 * 验证当前URL的前缀是否与页面访问地址一致，不一致则替换
 */
const replaceUrlPrefix = (url) => {
  const currentOrigin = window.location.origin; // 获取当前页面的地址前缀（协议 + 域名 + 端口）

  // 使用正则表达式匹配URL前缀
  const regex = /^https?:\/\/[^\/]+/;
  const urlPrefix = url.match(regex)[0]; // 获取返回地址的前缀
  // 如果返回地址的前缀和当前页面前缀不一致，则进行替换
  if (urlPrefix !== currentOrigin) {
    return url.replace(regex, currentOrigin);
  }

  // 如果一致，则返回原地址
  return url;
}
/**
 * get pic of item, if not, use default
 * @param {Object} item
 * @returns  {url}
 */
const getMediaPic = (item) => {
  switch (item.file_type) {
    case 'image':
      let url = item.url.http_url[0]
      if (item.info && item.info.transform_png && item.info.transform_png.http_url.length > 0) {
        url = item.info.transform_png.http_url[0].replace(/bmp/, 'png')
      }
      if (url) {
        return replaceUrlPrefix(url)
      }else {
        return require ('@/assets/images/2.png')
      }
      break;
    
    case 'video':
      if (item?.cover_image?.preview_name) {
        return replaceUrlPrefix(`${path.dirname(item.cover_image.url[0])}/${item.cover_image.preview_name}`);
      }
      return require ('@/assets/images/2.png')
      break;
    case 'audio': 
      return require('@/assets/images/editImags/th.png');
      break;
    default:
      break;
  }
}
/**
 * 
 * @param {number} val millisecond
 * @returns {string} HH:mm:ss
 */
const calculationFilter = (val) => {
  let hour, minut, second
  hour = parseInt(val / (60*60*1000))
  val -= hour*60*60*1000
  minut = parseInt(val / (60*1000))
  val -= minut*60*1000
  second = parseInt(val / 1000)
  if (hour < 10) {
    hour = '0' + hour
  }
  if (minut < 10) {
    minut = '0' + minut
  }
  if (second < 10) {
    second = '0' + second
  }
  return `${hour}:${minut}:${second}`
}

/**
 * 
 * 解析配置文件里的baseURL
 */

const formatBaseUrl = (baseObj) => {
  function testHttp (url) {
    if (/^http/.test(url)) {
      return url
    }else {
      return location.origin + url
    }
  }

  Object.keys(baseObj).forEach(key => {
    // 去除最后一位的 /
    baseObj[key] = baseObj[key].replace(/\/$/, '')

    if (!['editorSocket', 'mediaSocket', 'mediaPath'].includes(key)) {
      baseObj[key] = testHttp(baseObj[key])
    }

  })

  return baseObj
}

/**
 * 格式化文件大小，自动转换单位
 */

const sizeFormat = (size) => {
  if (!size) {
    return '-'
  }
  const unitArray = new Array('B', 'KB', 'MB', 'GB', 'TB')
  let index = 0
  let srcsize = parseFloat(size)
  index = Math.floor(Math.log(srcsize) / Math.log(1024))
  let formatsize = srcsize / Math.pow(1024, index)
  formatsize = +(formatsize.toFixed(2))
  return formatsize + unitArray[index]
}

export {
  randomSignatureKey, 
  getDurPlayerUrl, 
  getPlayerUrl, 
  calculationFormat, 
  fileParse, 
  calcOffset,
  controlForamtTime,
  urlFormat,
  paddingZero,
  FullScreen,
  colorFormat,
  deepCopy,
  fileDuration,
  hex2int,
  timeStamp,
  timeTuning,
  colorHex,
  downloadFileByBase64,
  getMediaPic,
  parseProgram,
  calculationFilter,
  formatBaseUrl,
  sizeFormat,
  replaceUrlPrefix
}