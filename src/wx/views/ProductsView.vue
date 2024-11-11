<template>
  <div class="products-wrapper">
    <header class="products-header">
      <img v-if="false" class="products-logo" src="../../assets/wxImages/logo.png" alt="">
      <span class="products-title"> | 智能短视频精选视频</span>
    </header>
    <van-pull-refresh class="media-lists" v-model="refreshing" @refresh="refreshList">
      <van-list
        v-model="loading"
        :finished="finished"
        finished-text=""
        @load="loadMore"
      >
        <div class="media-item-box">
          <div v-for="item in lists" :key="item.id + item.created_at" :title="item"
            class="media-item">
            <div class="media-content">
              <div class="media-video">
                <img v-if="configCover(item)" :src="configCover(item)" alt="">
                <div class="media-message">
                  <p>{{ item.id }}</p>
                </div>
                <div class="custom-icon" @click.stop.prevent="priviewHandle(item)"></div>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
    <!-- 预览成品 -->
    <van-popup v-if="popupVisible" v-model="popupVisible" closeable class="unit-popup">
      <div class="products-view-wrapper">
        <video webkit-playsinline playsinline x5-playsinline
          id="viewVideo"
          :src="priviewInfo.video_url"
          controlslist="nodownload noremoteplayback"
          muted
          autoplay
          loop
          controls
          style="vertical-align: bottom; background: #000;"
          ></video>
        <p class="priview-id" v-if="priviewInfo.id">视频编号：{{ priviewInfo.id }}</p>
        <div v-if="!isPhone" class="qrcode-wrapper">
          <div class="qrcode" ref="qrcodeshowproject"></div>
          <div class="qrcode-bottom"></div>
          <div class="qrcode-foot">
            扫描输入视频编号即可获得视频
          </div>
        </div>
      </div>
    </van-popup>

  </div>
</template>

<script>
import { ProductList, createSmartVideo, deleteSmartVideo, GetProjectsList } from '@/api/projects.js'
import { downloadFileByBase64, calculationFormat, sizeFormat } from '@/unit/index.js'
import Vue from 'vue'
import { Toast } from 'vant';
export default {
  name: "productsview",
  data() {
    return {
      limit: 30,
      offset: 1,
      totalNum: 0,
      lists: [],
      loading: false,
      refreshing: false,
      finished: false,
      uploadlimit: 0,
      popupVisible: false,
      priviewInfo: {
        file_url: '',
        id: ''
      },
      pageQrcode: null
    }
  },
  computed: {
    isPhone: function() {
      function isMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // 检查常见的移动设备和浏览器标识
        return /android|avantgo|blackberry|iemobile|iphone|ipad|ipod|minimo|mobile|palm( os)?|phone|pocket|psp|silk|symbian|tablet|up.browser|up.link|webos|wos/i.test(userAgent);
      }
      return isMobile()
    }
  },
  watch: {
    popupVisible: function(val) {
      if (!val) {
        const video = document.getElementById('viewVideo')
        video.src = ''
        if (this.pageQrcode) {
          this.pageQrcode.clear()
          this.pageQrcode = null
        }
      }
    }
  },
  mounted() {
    this.getLists()
    const thiz = this
    Vue.prototype.mediaUpload.$socket_io.on('smart_video_status', function(val) {
      thiz.refreshList()
    })
  },
  methods: {
    async loadMore() {
      if (this.totalNum <= this.lists.length) {
        return;
      }
      this.loading = true
      this.offset ++
      await this.getLists()
      this.loading = false
    },
    async refreshList() {
      let refresh_offset = 1, maxoffset = 1, data = [],
      limit = Math.ceil(this.lists.length / 20) * 20
      if (this.lists.length > 100) {
        maxoffset = Math.ceil(this.lists.length / 100)
        limit = 100
      }
      while (refresh_offset <= maxoffset) {
        const { rows, count } = await this.getData(refresh_offset, limit) || {}
        if (!rows && !count) {
          break;
        }
        if (!rows.length) {
          this.offset = (refresh_offset - 1) || 1
          break;
        }
        data = data.concat(rows)
        this.totalNum = count
        refresh_offset++
      }
      this.lists = data
      this.loading = false
      this.refreshing = false
      if (this.totalNum === this.lists.length) {
        this.finished = true
      }
    },
    async getLists() {
      try {
        const { rows, count } = await this.getData() || {}
        if (!rows && !count) {
          return;
        }
        this.totalNum = count
        if (this.offset === 1) {
          this.lists = []
        }
        this.lists = this.lists.concat(rows)
        this.loading = false
        if (this.totalNum === this.lists.length) {
          this.finished = true
        }
      } catch (error) {
        
      }
    },
    async getData(offset, limit) {
      try {
        const getProp = {
          // openid: this.$root.Config.WXInfo.openid,
          // activity_id: +JSON.parse(sessionStorage.urlobj).activity_id,
          offset: offset ? offset : this.offset,
          limit: limit ? limit : this.limit,
          status: ["success"]
        }

        const res = await ProductList(getProp, this.$root.mediaPath)

        if (res.data.ret.code === 0) {
          const { rows, count } = res.data.data
          return { rows, count }
        }
      } catch (error) {
        return {}
      }
    },
    configCover(item) {
      if (item?.config?.cover_img) {
        return item.config.cover_img.replace('png', 'jpg')
      } else {
        return ''
      }
    },
    downloadHandle(item) {
      const userAgent = navigator.userAgent.toLowerCase();
      // 判断是否在微信浏览器中
      if (userAgent.indexOf('micromessenger') !== -1) {
        // 是微信浏览器
        console.log('当前在微信浏览器');
        this.$copyText(item.video_url).then(
          (e) => {
            Toast('下载链接复制成功，请在其他浏览器下载');
          },
          (e) => {
            Toast('复制失败');
          }
        );

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
      return moment(time).format('YYYY-MM-MM HH:mm:ss')
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
      if (!this.isPhone) {
        /**
         * 获取活动信息
         *
         */
        let projectObject = null
        try {
          const projectProp = {
            id: +item.activity_id
          }
          const res = await GetProjectsList(projectProp, this.$root.mediaPath)
          if (res.data.ret.code === 0) {
            projectObject = res.data.data.rows[0]
          }
        } catch (error) {
          
        }
        const WxInfo = this.$root.Config.WXInfo
        const redirect_uri = location.origin + WxInfo.redirectUrl
        // 以下划线分隔，第一个是活动ID，第二个指定类型（马拉松或者智能短视频）
        const stateStr = `${projectObject.id}_${projectObject.type}`
        const qrcodeUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WxInfo.appid}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=snsapi_userinfo&state=${stateStr}#wechat_redirect`
        console.log(qrcodeUrl)
        if (!this.pageQrcode) {
          this.pageQrcode = new QRCode(this.$refs.qrcodeshowproject, {
            text: qrcodeUrl,
            width: 150,
            height: 150,
            colorDark: "#333333", //二维码颜色
            colorLight: "#ffffff", //二维码背景色
            correctLevel: QRCode.CorrectLevel.L //容错率，L/M/H
          });
        } else {
          this.pageQrcode.clear()
          this.pageQrcode.makeCode(qrcodeUrl)
        }
      }
    },
  }
}
</script>

<style lang="scss">

</style>

<style lang="scss" scoped>
.products-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-image: url('~@/assets/wxImages/home_bg_black.png');
  .products-header {
    padding: .1rem;
    color: #fff;
    font-size: .16rem;
    background: rgba(222,222,222,0.3);
    backdrop-filter: blur(14px);
    .products-logo {
      height: .14rem;
    }
    .products-title {

    }
  }
  .media-lists {
    flex: 1;
    // height: 100%;
    overflow: auto;
    &::-webkit-scrollbar {
      display: none; /* 隐藏 WebKit 内核浏览器的滚动条 */
    }
    .media-item-box {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(1.5rem, 1fr)); /* 自动填充列 */
      gap: .1rem;
    }
    .media-item {
      display: flex;
      height: 1.4rem;
      padding: .1rem;
      margin-bottom: .1rem;
      .media-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        .media-video {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
          border-radius: .12rem;
          background: rgba(222,222,222,0.45);
          img {
            flex: 1;
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .media-message {
            font-size: .12rem;
            padding: .1rem;
            color: #fff;
            background: rgba(222,222,222,0.45);
          }
          .custom-icon {
            position: absolute;
            left: 50%;
            top: 40%;
            width: .5rem; /* 根据你的图标大小调整 */
            height: .5rem; /* 根据你的图标大小调整 */
            transform: translate(-50%, -50%);
            background-repeat: no-repeat;
            background-image: url('~@/assets/wxImages/play.png');
            background-size: contain;
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
    }
    @media (min-width: 768px) {
      .media-item-box {
        grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr)); /* 自动填充列 */
      }
      .media-item {
        height: 2.8rem;
      }
    }
  }
  .media-limit {
    flex: none;
    // position: absolute;
    // bottom: 0;
    left: 0;
    width: 100%;
    height: 1.2rem;
    padding: .2rem 0;
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
      font-size: .14rem;
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
      #viewVideo {
        width: 100%;
        height: 4rem;
      }
      .qrcode-wrapper {
      }
    }
    .priview-id {
      color: #fff;
      font-size: .16rem;
      line-height: 2;
    }
  }
  @media (min-width: 768px) {
    .unit-popup {
      width: 40%;
      .products-view-wrapper {
        .qrcode-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: .2rem;
        }
        .qrcode-bottom {
          width: 100%;
          height: 2px;
          margin: .2rem 0;
          background: #FFFFFF;
          opacity: 0.08;
        }
        .qrcode-foot {
          color: rgba(255,255,255,0.96);
          font-size: .12rem;
        }
      }
    }
    .van-overlay {
      background-color: rgba(0,0,0,.3);
    }
  }
}
</style>