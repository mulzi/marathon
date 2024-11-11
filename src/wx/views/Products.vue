<template>
  <div class="products-wrapper">
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
            <div class="media-image">
              <div class="media-header">
                <div class="media-content">
                  <img v-if="item.userimgurl" :src="item.userimgurl" alt="">
                </div>
                <p v-if="item.config.text && item.config.text.text" class="ellipsis" :title="item.config.text.text">
                  {{ item.config.text.text }}
                </p>
              </div>
            </div>
            <div class="media-content">
              <div class="media-video">
                <img v-if="configCover(item)" :src="configCover(item)" alt="">
                <div class="media-message">
                  <p>{{ formatTime(item.created_at) }}</p>
                  <p> {{ item.id }} </p>
                </div>
                <div v-if="item.status === 'success'"
                  class="custom-icon" @click.stop.prevent="priviewHandle(item)"></div>
                <div v-if="item.status === 'fail'"
                  class="custom-fail">生成失败</div>
              </div>
              <div class="media-download">
                <van-button v-if="item.status === 'success'"
                round class="media-download-btn"
                @click.stop.prevent="downloadHandle(item)"
                @touchend.native.stop.prevent="downloadHandle(item)">保存视频</van-button>
              </div>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
    <div class="media-limit">
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
import { ProductList, getDspWeixinInfo } from '@/api/projects.js'
import { downloadFileByBase64, calculationFormat, sizeFormat } from '@/unit/index.js'

import Vue from 'vue'
import { Toast } from 'vant';
export default {
  name: "products",
  data() {
    return {
      limit: 30,
      offset: 1,
      totalNum: 0,
      lists: [],
      loading: false,
      refreshing: false,
      finished: false,
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
    this.getLists()
    const thiz = this
    Vue.prototype.mediaUpload.$socket_io.on('smart_video_status', function(val) {
      if (val.openid === thiz.$root.Config.WXInfo.openid) {
        thiz.refreshList()
      }
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
      if (this.lists.length === this.totalNum) {
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
        if (this.lists.length === this.totalNum) {
          this.finished = true
        }
        if (this.$route?.query?.id) {
          await this.$nextTick()
          for (let [key, value] of this.lists.entries()) {
            if (value.id == this.$route.query.id) {
              document.querySelectorAll('.media-item')[key].scrollIntoView({
                behavior: "smooth", block: "start",
              })
            }
          }
        }
        // 查询当前的任务数量
        this.getSmartCount()
      } catch (error) {
        
      }
    },
    async getSmartCount() {
      const res = await getDspWeixinInfo({
        url: (location.href.split('#')[0]),
      }, this.$root.mediaPath)
      if (res.data.ret.code === 0) {
        const wxinfo = res.data.data
        this.uploadlimit =  wxinfo?.smart_count
      }
    },
    async getData(offset, limit) {
      try {
        const getProp = {
          openid: this.$root.Config.WXInfo.openid,
          // activity_id: +JSON.parse(sessionStorage.urlobj).activity_id,
          offset: offset ? offset : this.offset,
          limit: limit ? limit : this.limit,
          get_from_user: true
          // status: ["success", "fail"]
        }
        if (this.$root.Config.WXInfo.activity_mark_str) {
          Object.assign(getProp, {
            activity_mark_str: this.$root.Config.WXInfo.activity_mark_str
          })
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
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-image: url('~@/assets/wxImages/home_bg_black.png');
  .media-lists {
    flex: 1;
    // height: 100%;
    overflow: auto;
    &::-webkit-scrollbar {
      display: none; /* 隐藏 WebKit 内核浏览器的滚动条 */
    }
    .media-item {
      display: flex;
      height: 2.6rem;
      padding: .1rem;
      margin-bottom: .1rem;
      .media-image {
        display: flex;
        justify-content: center;
        width: 1rem;
        flex: none;
        .media-header {
          width: .8rem;
          .media-content {
            height: .8rem;
            border-radius: 50%;
            overflow: hidden;
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          p {
            color: #fff;
            line-height: 1.5;
          }
        }
      }
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