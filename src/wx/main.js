
import Vue from 'vue';
import App from './App.vue';
import App1 from './App1.vue';

import router from './router.js'
import store from '../store';
import '@/assets/css/common.scss';
import {fileDuration, getMediaPic, formatBaseUrl} from '@/unit/index.js';
import {AxioInit} from '@/api/index.js';
import MediaUpload from '@/unit/mediaUpload.js';
import { getDspWeixinInfo } from '@/api/projects.js';
import VueClipboard from 'vue-clipboard2'
import Vant from 'vant';
import 'vant/lib/index.css';
import 'animate.css'
// import * as VConsole from "vconsole";
//
// const vconsole = new VConsole()

localStorage.typepage = 'wxpage'

const {
  editorBaseUrl, editorSocket, portalBaseUrl, mediaBaseUrl, mediaSocket, mediaPath
} = formatBaseUrl (window.$config.configUrl)

Vue.config.productionTip = false;

Vue.use(VueClipboard);
Vue.use(Vant);

// 微信挂载
(async function() {
  // 解析页面token与活动id
  let url_obj = {};
  if (typeof location.search !== 'undefined') {
    const url_search = location.search.substring(1).split(';')[0];
    const url_arry = url_search.split('&');
    let newurl_arry = [];
    url_arry.forEach(i => {
      newurl_arry = i.split('=');
      if (typeof url_obj[newurl_arry[0]] === 'undefined') {
        url_obj[newurl_arry[0]] = newurl_arry[1];
      }
    });
    if (url_obj.token) {
      sessionStorage.token = url_obj.token
    }
  }
  sessionStorage.urlobj = JSON.stringify(url_obj)

  // 初始化axios实例
  try {
    await AxioInit(editorBaseUrl)
  } catch (error) {
    console.log(error, 'error')
  }
  /**
   * 微信挂载
   */
  const res = await getDspWeixinInfo({
    url: (location.href.split('#')[0]),
  }, mediaPath)
  if (res.data.ret.code === 0) {
    const wxinfo = res.data.data
    Object.assign(window.$config.WXInfo, {
      appid: wxinfo.appid,
      openid: wxinfo.weixinuser.openid,
      nickname: wxinfo.weixinuser.nickname,
      headimgurl: wxinfo.weixinuser.headimgurl,
      smart_count: wxinfo.smart_count
    })
    await wx.config({
      debug: window.$config.WXInfo.debug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
      appId: wxinfo.appid, // 必填，公众号的唯一标识
      timestamp: wxinfo.timestamp, // 必填，生成签名的时间戳
      nonceStr: wxinfo.noncestr, // 必填，生成签名的随机串
      signature: wxinfo.signature,// 必填，签名
      jsApiList: ['chooseImage', 'getLocalImgData', 'previewImage', 'downloadImage',
        'startRecord',
        'stopRecord',
        'onVoiceRecordEnd',
        'playVoice',
        'pauseVoice',
        'stopVoice',
        'onVoicePlayEnd',
        'uploadVoice',
        'downloadVoice',
        'translateVoice'
      ] // 必填，需要使用的JS接口列表
    });
  }

Vue.prototype.mediaUpload = null;

if (sessionStorage.token) {
  Vue.prototype.mediaUpload = new MediaUpload({
    url: mediaBaseUrl.match(/http\S+[\., \:]\w+/)[0],
    token: sessionStorage.getItem('token'),
    mediaSocket,
    mediaPath
  })
}

let pathway_type = JSON.parse(JSON.stringify(window.$config.pathwayType))

if (sessionStorage.pathwayType) {
  pathway_type = JSON.parse(sessionStorage.pathwayType)
}

const mixinsData = {
  data: {
    mediaPath,
    mediaBaseUrl,
    editorBaseUrl,
    portalBaseUrl,
    typePage: 'edit',
    Config: window.$config,
    pathwayType: pathway_type,
  },
  methods: {
    fileDuration: fileDuration,
    mediaPic: getMediaPic
  },
};
window.vmEdit = new Vue({
  el: '#app',
  mixins: [mixinsData],
  router,
  store,
  render: h => h(App)
})

})();
