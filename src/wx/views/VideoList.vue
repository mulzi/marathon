<template>
  <div class="products-wrapper">


            <div class="media-content">
              <div class="media-video">
                <img v-if="configCover(item)" :src="configCover(item)" alt="">
                <div class="media-message">

                  <p>编号：{{ item.id }}</p>
                  <p>生成时间：{{ formatTime(item.created_at) }}</p>

                </div>
                <div v-if="item.status === 'success'"
                  class="custom-icon" @click.stop.prevent="priviewHandle(item)"></div>
                <div v-if="item.status === 'fail'"
                  class="custom-fail">生成失败</div>
              </div>

            </div>
            <div class="download-a">
              <div class="media-image">
                <div class="media-header">
                  <div class="media-content-a" v-if="item.userimgurl">
                    <img v-if="item.userimgurl" :src="item.userimgurl" alt="">
                  </div>
                  <p v-if="item.config.text && item.config.text.text" class="ellipsis" :title="item.config.text.text">
                    {{ item.config.text.text }}
                  </p>
                </div>
              </div>
              <div class="right_btn_box" v-if="one" @click="changeFlag">
                 <p class="p1">美好瞬间当然要永久留存呀~</p>
                 <p class="p2">点击保存</p>
              </div>
              <div class="right_btn_box-a" v-if="two" @click="clickPlay">
                <p  class="p3">￥30</p>
                <p  class="p4">支付完成就可以把我带走啦~</p>
              </div>
              <div v-if="downFlag" class="right_btn_box-b"  @click.stop.prevent="downloadHandle(item)">
                <p  class="p5">点击下载到本地</p>
              </div>

            </div>



    <div class="media-download" v-if="false">
      <van-button v-if="item.status === 'success'"
                  round class="media-download-btn"
                  @click.stop.prevent="downloadHandle(item)"
                 >保存视频</van-button>
    </div>
    <div class="media-limit" v-if="false">
      <van-button class="control-button primary-control" type="default"
        :disabled="uploaddisabled"
        @click.stop.prevent="goHome"
      >还想要一段</van-button>
      <template v-if="false">
        <p class="media-limit-tip">文博会期间每天最多可以生成3段视频哦！</p>
        <p class="media-limit-tip">以上视频由KXWELL云拍摄系统生成，仅用于文博会期间记录您参观的精彩瞬间。</p>
        <p class="media-limit-tip">本活动最终解释权归科旭威尔及深圳报业集团所有。</p>
      </template>
    </div>
    <!-- 预览成品 -->
    <van-popup v-if="popupVisible" v-model="popupVisible" closeable class="unit-popup">
      <div class="products-view-wrapper">
        <video webkit-playsinline playsinline x5-playsinline
          id="viewVideo"
          :src="priviewInfo.video_url"
          controlslist="nodownload noremoteplayback"
          muted
          autoplay
          controls
          style="vertical-align: bottom; background: #000;"
          width="100%" height="100%"></video>
      </div>
    </van-popup>

  </div>
</template>

<script>
import md5 from 'js-md5'
import { downloadFileByBase64, calculationFormat, sizeFormat } from '@/unit/index.js'

import Vue from 'vue'
import {Dialog, Toast} from 'vant';
import axios from "axios";
export default {
  name: "videoList",
  props:['item','title'],

  data() {
    return {
      limit: 30,
      offset: 1,
      totalNum: 0,
      lists: [],
      loading: false,
      refreshing: false,
      finished: false,
      one:true,
      two:false,
      downFlag:false,
      uploadlimit: window.$config.WXInfo?.smart_count || 0,
      popupVisible: false,
      priviewInfo: {
        file_url: ''
      },
    }
  },
  computed: {
    uploaddisabled: function() {
      return false
      const urlobj = JSON.parse(sessionStorage.urlobj)
      return this.uploadlimit >= 3 && urlobj.tg !== 'tgh'
    }
  },
  watch: {
    popupVisible: function(val) {
      if (!val) {
        const video = document.getElementById('viewVideo')
        video.src = ''
      }
    }
  },
  mounted() {
    const thiz = this
    Vue.prototype.mediaUpload.$socket_io.on('smart_video_status', function(val) {
      if (val.openid === thiz.$root.Config.WXInfo.openid) {
        thiz.refreshList()
      }
    })
    thiz.checkOrder()
  },
  methods: {
    changeFlag(){
      this.one = false
      this.two = true
    },

    checkOrder(){  //检查订单
      const that = this
      const url = 'https://mls.jdnews.com.cn/mls-pay/api/order/query-pay-status'
      const params = {
        "videoId": this.item.id, //视频id
        "openId": this.$root.Config.WXInfo.openid, //公众号下微信用户的openId
      }
      const timestamp = new Date().getTime()
      const Authorization = md5(`7F3BF63F3EF14BC18FE3220614DA7116` + this.$root.Config.WXInfo.appid + this.$root.Config.WXInfo.openid + timestamp)
      const header ={
        headers:{
         'ys-app-id': this.$root.Config.WXInfo.appid,
          "ys-openid":this.$root.Config.WXInfo.openid, //公众号下微信用户的openId
          "ys-timestamp": timestamp,
          "Authorization": Authorization,
        }
      }
      axios.post(url,params,header).then(res=>{
        console.log(res)
        if (res.data.code == 0){
          if (res.data.data.paySuccess == true){
                that.one = false
                that.two = false
               that.downFlag = true
          }
        }

      })
    },
    clickPlay(){
      const userAgent = navigator.userAgent.toLowerCase();
      // 判断是否在微信浏览器中
      if (userAgent.indexOf('micromessenger') === -1) {
        console.log('当前不在微信浏览器');
        Dialog.alert({
          title: '提示',
          message: '请在微信里点击支付！'
        }).then(() => {
        });
        return false
      }
      Toast.loading({
        mask: true,
        message: 'loading...'
      });
      const that = this
      const url = 'https://mls.jdnews.com.cn/mls-pay/api/jsapi/order/create'
      const params = {
        "videoId": this.item.id, //视频id
        "openId": this.$root.Config.WXInfo.openid, //公众号下微信用户的openId
        "nickname": this.$root.Config.WXInfo.nickname, //公众号下微信用户的openId
      }
      const timestamp = new Date().getTime()
      const Authorization = md5(`7F3BF63F3EF14BC18FE3220614DA7116` + this.$root.Config.WXInfo.appid + this.$root.Config.WXInfo.openid + timestamp)
      const header ={
        headers:{
          'ys-app-id': this.$root.Config.WXInfo.appid,
          "ys-openid":this.$root.Config.WXInfo.openid, //公众号下微信用户的openId
          "ys-timestamp": timestamp,
          "Authorization": Authorization,
        }
      }
      axios.post(url,params,header).then(res=>{
        console.log(res)
        if (res.data.code == 0){

          that.onBridgeReady(res.data.data)
        }
      })
    },
    onBridgeReady(data) {
      const that = this
      WeixinJSBridge.invoke('getBrandWCPayRequest', {
            "appId": data.appId,     //公众号ID，由商户传入
            "timeStamp": data.timeStamp,     //时间戳，自1970年以来的秒数
            "nonceStr": data.nonceStr,      //随机串
            "package":  `prepay_id=${data.prepayId}`,
            "signType": "RSA",     //微信签名方式：
            "paySign": data.paySign //微信签名
          },
          function(res) {
            console.log(res)
            if (res.err_msg == "get_brand_wcpay_request:ok") {
              // 使用以上方式判断前端返回,微信团队郑重提示：
              //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
              Dialog.alert({
                title: '提示',
                message: '支付成功'
              }).then(() => {
                Toast.loading({
                  mask: true,
                  message: 'loading...'
                });
                setTimeout(()=>{
                  that.checkOrder()
                },1300)
              });


            }
            if (res.err_msg == "get_brand_wcpay_request:cancel") {
              // 使用以上方式判断前端返回,微信团队郑重提示：
              //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
              Dialog.alert({
                title: '提示',
                message: '支付过程中用户取消'
              }).then(() => {
              });

            }
            if (res.err_msg == "get_brand_wcpay_request:fail") {
              // 使用以上方式判断前端返回,微信团队郑重提示：
              //res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
              Dialog.alert({
                title: '提示',
                message: '支付失败'
              }).then(() => {
              });
            }
          });
    },

    configCover(item) {
      if (item?.config?.cover_img) {
        return item.config.cover_img.replace('png', 'jpg')
      } else {
        return ''
      }
    },
    downloadHandle(item) {
      if (!item.video_url){
        Toast('视频链接错误或视频链接未生成！')
        return false
      }
      const userAgent = navigator.userAgent.toLowerCase();
      // 判断是否在微信浏览器中
      if (userAgent.indexOf('micromessenger') !== -1) {
        // 是微信浏览器
        console.log('当前在微信浏览器');
        this.$router.push({
          path:'/download',
          query:{
            downloadUrl:item.video_url
          }
        })

      } else {
        // 不是微信浏览器
        console.log('当前在其他浏览器');
        let name = item.video_url.substring(item.video_url.lastIndexOf('/')+1, item.video_url.length)

        downloadFileByBase64(item.video_url, name)
      }

    },
    goHome() {
      this.$router.replace({
        path: '/home'
      })
    },
    formatTime(time) {
      return moment(time).format('YYYY-MM-DD HH:mm:ss')
    },
    async priviewHandle(item) {
      this.priviewInfo = item
      this.popupVisible = true
      await this.$nextTick()
      const video = document.getElementById('viewVideo')
      video.addEventListener('canplay', () => {
        video.play()
        video.muted = false
      })
    },
  }
}
</script>

<style lang="scss" scoped>
.products-wrapper {



  .download-a{
    display: flex;
    align-items: center;
    width: 91%;
    margin: 0 auto 0.6rem;
    .media-image {
      display: flex;
      justify-content: center;
      width: 1rem;
      flex: none;
      .media-header {
        width: 1rem;
        .media-content-a {
          height: 1rem;
          border-radius: 0.13rem;
          overflow: hidden;
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        p {
          height: 1rem;
          border-radius: 0.13rem;
          overflow: hidden;
          color: #fff;
          line-height: 1rem;
          text-align: center;
          background: #1B82D6;
          box-shadow: 0 2px 4px rgba(0,0,0,.2);
        }
      }
    }
    .right_btn_box{
      height: 1rem;
      flex: 1;
      margin-left: 0.4rem;
      background: url('~@/assets/wxImages/image/btn_01.png') center / 100% 100% no-repeat;
      display: flex;
      align-items: center;
      .p1{
        color: #0B80F1;
        font-size: 0.28rem;
        padding-left: 0.2rem;
        font-weight: bold;
      }
      .p2{
        color: #3f3f3f;
        font-size: 0.28rem;
        padding-left: 0.2rem;
        font-weight: bold;
      }
    }
    .right_btn_box-a {
      height: 1rem;
      flex: 1;
      margin-left: 0.4rem;
      background: url('~@/assets/wxImages/image/btn_02.png') center / 100% 100% no-repeat;
      display: flex;
      align-items: center;
      .p3{
        color: #0B80F1;
        font-size: 0.5rem;
        padding-left: 0.2rem;
        font-weight: bold;
      }
      .p4{
        color: #3f3f3f;
        font-size: 0.28rem;
        padding-left: 0.4rem;
        font-weight: bold;
      }
    }
    .right_btn_box-b {
      height: 1rem;
      flex: 1;
      margin-left: 0.4rem;
      background: url('~@/assets/wxImages/image/btn_03.png') center / 100% 100% no-repeat;
      display: flex;
      align-items: center;
      .p5{
        flex: 1;
        color: #013C75;
        text-align: center;
        font-size: 0.3rem;
        font-weight: bold;
      }
    }
  }
  .media-content {

        display: flex;
        flex-direction: column;
        height:4rem ;
        border-radius: 0.1rem;
        width: 91%;
        margin: 0.2rem auto 0.15rem;
        overflow: hidden;
        border: 1px solid #FFFFFF;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3) ;
        .media-video {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
          border-radius: .12rem;
          background: rgba(222,222,222,0.45);
          height: 100%;
          img {
            flex: 1;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .media-message {
            font-size: .25rem;
            width: 92%;
            padding:0 4%;
            color: #fff;
            height: 1rem;
            background: linear-gradient(0deg,rgba(0,0,0,0.7),rgba(0,0,0,0.01));
            position: absolute;
            bottom: 0;
            left: 0;
            display: flex;
            align-items: center;
            p{
              margin: 0.3rem 0.3rem 0;
            }
          }
          .custom-icon {
            position: absolute;
            left: 50%;
            top: 50%;
            width: .9rem; /* 根据你的图标大小调整 */
            height: .9rem; /* 根据你的图标大小调整 */
            transform: translate(-50%, -50%);
            background-repeat: no-repeat;
            background-image: url('~@/assets/wxImages/play.png');
            background-size: contain;
          }
          .custom-fail {
            position: absolute;
            left: 50%;
            top: 40%;
            transform: translate(-50%, -50%);
            color: crimson;
            font-size: .2rem;
          }
        }
        .media-download {
          height: .6rem;
          line-height: .6rem;
          .media-download-btn {
            height: .4rem;
            line-height: .4rem;
            padding: 0 .3rem;
            font-size: .14rem;
            border-color: #00A5ED;
          }
        }
      }
  .media-limit {
    flex: none;
    // position: absolute;
    // bottom: 0;
    left: 0;
    // width: 100%;
    // height: 1.2rem;
    padding: .2rem;
    text-align: center;
    border-radius: .2rem .2rem 0 0;
    background-color: rgba(222,222,222,0.3);
    backdrop-filter: blur(.14rem);
    .control-button {
      width: 88%;
      height: .85rem;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      border: none;
      background-color: transparent;
      &::before {
        display: none;
      }
    }
    .primary-control {
      color: #fff;
      background-image: url('~@/assets/wxImages/button_primary.png');
    }
    .media-limit-tip {
      font-size: .11rem;
      color: #005C96;
    }
  }
  .unit-popup {
    width: 100%;
    background-color: transparent;
    background: rgba(149,149,149,0.25);
    box-shadow: 8px 8px 37px 0px rgba(0,0,0,0.13);
    border-radius: .3rem;
    backdrop-filter: blur(103.2110091743119px);
    .products-view-wrapper {
      padding: .48rem .2rem;
      margin: auto;
      .qrcode-wrapper {
      }
    }
    .priview-id {
      color: #fff;
      font-size: .16rem;
      line-height: 2;
    }
  }
}
</style>
