<template>
  <div id="app">
    <div class="wx-title" @touchend.stop.prevent="appTouch"
      @click.stop.prevent="appTouch">
      <div class="wx-title-content">
        <p class="wx-title-project">{{content.name}}</p>
        <p class="wx-title-tip">请上传人脸照片以抽取相关精彩集锦</p>
      </div>
      <div class="wx-title-image" :style="{
        'background-image': `url(${$root.Config.WXInfo.headimgurl})`
      }"></div>
    </div>
    <div class="wx-btn-wrapper" @touchend.stop.prevent="appTouch"
      @click.stop.prevent="appTouch">
      <div>
        成品库
      </div>
      <div v-if="loading">
        <van-loading type="fading-circle"></van-loading>
      </div>
      <van-button type="default" size="small" style="
        width: .8rem;
        background-color:#f5f8fa;
        border-radius: 0.16rem;
        transform: translateX(0.3rem);
        padding-left: 0rem;
        " 
        @touchend.native.stop.prevent="refreshHandle"
        @click.native.stop.prevent="refreshHandle">刷新</van-button>
    </div>
    <van-list class="media-lists"
      v-model="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
        <div v-for="item in lists" :key="item.id + item.created_at">
          <div class="item-image" @touchend.stop.prevent="choseHandle(item)"
            @click.stop.prevent="choseHandle(item)">
            <div class="left-content">
              <img v-if="item.userimgurl" :src="item.userimgurl" @click.stop.prevent="viewImage(item)"
                @touchend.stop.prevent="viewImage(item)" alt="人脸图片">
              <p v-if="item.config.text && item.config.text.text" class="ellipsis" :title="item.config.text.text">
                {{ item.config.text.text }}
              </p>
              <p v-if="item.config.random_str" class="ellipsis" :title="item.config.random_str">
                {{ item.config.random_str }}
              </p>
              <p v-if="item.config.process_search" class="ellipsis" :title="item.config.process_search">
                {{ item.config.process_search }}
              </p>
            </div>
            <ul class="file-url">
              <li>日期: {{timeFormat(item)}}</li>
              <li v-if="item.status !== 'success'" class="file-status" :title="statusMsg(item)">状态: {{statusMsg(item)}}</li>
              <template v-if="item.status === 'success'">
                <div class="sucees-wrapper">
                  <div>
                  <li class="file-status" :title="statusMsg(item)">状态: {{statusMsg(item)}}</li>
                    <li class="file-status">时长: {{durationFormater(item)}}</li>
                    <li class="file-status">大小: {{sizeFormater(item)}}</li>
                  </div>
                  <div>
                    <img :src="configCover(item)" alt="">
                  </div>
                </div>
              </template>
            </ul>
          </div>
          <div class="media-btn" v-show="choselist && item.id === choselist.id"
            @click.stop.prevent="cancelChose"
            @touchend.stop.prevent="cancelChose">
            <van-button type="info" size="small"
              v-show="item.video_url"
              class="mint-button view-btn"
              @click.stop.prevent="priviewHandle(item)"
              @touchend.native.stop.prevent="priviewHandle(item)"></van-button>
            <van-button type="info" size="small"
              v-show="item.video_url"
              class="mint-button download-btn"
              @click.stop.prevent="downloadHandle(item)"
              @touchend.native.stop.prevent="downloadHandle(item)"></van-button>
            <van-button type="danger" size="small"
              class="mint-button delete-btn"
              @click.stop.prevent=deleteHandle(item)
              @touchend.native.stop.prevent="deleteHandle(item)"></van-button>
          </div>
        </div>
        <div class="upload-btn" v-if="searchtypes.length > 0"
          @click.stop.prevent="createTask"
          @touchend.stop.prevent="createTask">+</div>
    </van-list>
    <!-- 添加任务 -->
    <van-action-sheet
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      @select="onSelectSheet"
      v-model="sheetVisible">
    </van-action-sheet>
    <!-- 预览 -->
    <van-popup
      v-if="popupVisible"
      v-model="popupVisible"
      style="width: 100%;"
      popup-transition="popup-fade">
      <video webkit-playsinline playsinline x5-playsinline
        id="viewVideo"
        :src="priviewInfo.video_url"
        controlslist="nodownload noremoteplayback"
        muted
        autoplay
        controls
        style="vertical-align: bottom; background: #000;"
        width="100%" height="100%"></video>
    </van-popup>
    <van-popup v-model="dialogVisible" class="createtask-popup">
      <span slot="title">自定义标题</span>
      <div v-if="searchtypes.includes('face')"
        style="text-align: center; margin-bottom: .2rem;">
        <div v-if="imgurl" style="position: relative; width: 2rem; height: 2rem; margin: .2rem auto;">
          <img
            style="width: 2rem; height: 2rem;object-fit: contain;"
            :src="imgurl" alt="">
          <van-button type="danger" class="img-delete" @click.stop="deleteImageHandle">X</van-button>
        </div>
        <div v-else style="width: 2rem; height: 2rem; line-height: 2rem; border: .01rem solid #eee; margin: .2rem auto; color: #888;">
        </div>
        <van-button type="info" :disabled="loading" @click.stop="uploadHandle">选取图片</van-button>
      </div>
      <template v-if="searchtypes.includes('number_plate')">
        <van-field 
          label="号码牌" placeholder="请输入号码牌(可选)" :disabled="loading" v-model="platenumber"></van-field>
      </template>
      <template v-if="searchtypes.includes('voice')">
        <van-field v-if="textinputype === 'keyboard'"
          v-model="record_result"
          center
          clearable
          placeholder="请输入文本内容"
        >
          <template #label>
            <div class="record-btn" @click.stop="changeInputType('volice')">
            </div>
          </template>
        </van-field>
        <van-field v-if="textinputype === 'volice'">
          <template #label>
            <div class="keyboard-btn" @click.stop="changeInputType('keyboard')">
            </div>
          </template>
          <template #input>
            <van-button block hairline type="default" native-type="submit"
              :disabled="loading"
              @touchstart.native.stop="startRecordHandle"
              @touchend.native.stop="endRecordHandle"
              @mousedown.native.stop="startRecordHandle"
              @mouseup.native.stop="endRecordHandle"
            >按住 说话</van-button>
          </template>
        </van-field>
      </template>
      <div style="text-align: center; margin-top: .2rem;">
        <van-button type="info" :disabled="loading" @click.native="createSmartTask">
          抽取视频
          <van-loading v-if="loading" style="display: inline-block;vertical-align: middle;" type="fading-circle"></van-loading>
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script>
import Vue from 'vue'
import {Toast} from 'vant';
import { downloadFileByBase64, calculationFormat, sizeFormat } from '@/unit/index.js'

import { ProductList, createSmartVideo, deleteSmartVideo, GetProjectsList } from '@/api/projects.js'
import { TaskBase64ToMedia } from '@/api/task.js'

export default {
  name: 'WxApp1',
  data() {
    return {
      content: {}, // 活动详情
      loading: false,
      limit: 10,
      offset: 1,
      totalNum: 0,
      lists: [],
      choselist: null,
      popupVisible: false,
      priviewInfo: {
        file_url: ''
      },
      // 添加任务
      sheetVisible: false,
      actions: [
        {
          name: '抽取短视频'
        },
      ],
      dialogVisible: false,
      imgurl: '',
      random_str: '',
      platenumber: '',
      record_result: '',
      textinputype: 'keyboard', //volice keyboard
      finished: false,
    }
  },
  computed: {
    searchtypes: function() {
      if (this.content?.config?.modeling?.searchtypes) {
        return this.content.config.modeling.searchtypes
      } else {
        return []
      }
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
    this.getProjectById()
    this.getLists()
    const thiz = this
    Vue.prototype.mediaUpload.$socket_io.on('smart_video_status', function(val) {
      if (val.openid === thiz.$root.Config.WXInfo.openid) {
        thiz.refreshList()
      }
    })
  },
  methods: {
    createTask() {
      this.sheetVisible = true
    },
    onSelectSheet(item) {
      this.uploadMessage()
    },
    uploadMessage() {
      this.dialogVisible = true
    },
    deleteImageHandle() {
      this.imgurl = ''
    },
    uploadHandle() {
      const thiz = this
      wx.chooseImage({
        count: 1, // 默认9
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: function (res) {
          var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
          wx.getLocalImgData({ // 获取本地图片
            localId: localIds[0],
            success: function (res) {
              let localData = res.localData,
              checkImage = '';
              if(localData.includes('base64')){ //我传给后台的参数是不需要data:image/png;base64,所以去掉了。大家可以根据具体的业务需求对该格式做变化。
                checkImage = localData
              }else{
                checkImage = 'data:image/png;base64,' + localData;
              }
              thiz.imgurl = checkImage
              // thiz.UploadImage(localIds[0], checkImage)
            }
          });
        }
      });
    },
    async createSmartTask() {
      if ( !this.imgurl && !this.random_str && !this.platenumber && !this.record_result ) {
        Dialog.alert({
          message: '请至少填写一项',
        })
        return
      }
      try {
        this.loading = true
        const wxinfo = this.$root.Config.WXInfo
        const urlobj = JSON.parse(sessionStorage.urlobj)
        let image_id = null
        if (this.imgurl) {
          // 存在上传图片, 需要上传到media，获取media ID
          const params = {
            wxinfo: {
              "openid": wxinfo.openid,
              "nickname": wxinfo.nickname
            },
            activity_id: +urlobj.activity_id,
            label: ['素材', '智能短视频', '人脸图片'],
            name: `${wxinfo.nickname}_${urlobj.activity_id}_${moment().valueOf()}`,
            file_image: this.imgurl
          }
          const res = await TaskBase64ToMedia(params)
          if (res.data.ret.code === 0) {
            image_id = res.data.data.media_id
          }
        }
        const resProp = {
          activity_id: +urlobj.activity_id,
          tg: urlobj.tg,
          wxinfo: {
            ...wxinfo
          }
        }
        // 存在图片标识是，忽略上传图片
        if (this.random_str) {
          Object.assign(resProp, {
            random_str: this.random_str
          })
        } else if (image_id !== null) {
          Object.assign(resProp, {
            media_id: image_id
          })
        }
        if (this.platenumber) {
          Object.assign(resProp, {
            text: {
              text: this.platenumber
            }
          })
        }
        if (this.record_result) {
          Object.assign(resProp, {
            process_search: this.record_result
          })
        }
        const resp = await createSmartVideo(resProp, this.$root.mediaPath)
        if (resp.data.ret.code) {
          Dialog.alert({
            message: resp.data.ret.cn,
          })
        }
        this.loading = false
        this.dialogVisible = false
      } catch (error) {
        this.loading = false
        this.dialogVisible = false
        Dialog.alert({
          message: '创建任务错误 ' + error.message
        })
      }
    },
    // uploadApi
    async UploadImage(name, url) {
      /**
       * 通过id 生成图片对象
       */
      try {
        this.loading = true
        const wxinfo = this.$root.Config.WXInfo
        const urlobj = JSON.parse(sessionStorage.urlobj)
        const params = {
          wxinfo: {
            "openid": wxinfo.openid,
            "nickname": wxinfo.nickname
          },
          activity_id: +urlobj.activity_id,
          label: ['素材', '智能短视频', '人脸图片'],
          name: `${wxinfo.nickname}_${urlobj.activity_id}_${moment().valueOf()}`,
          file_image: url
        }

        const res = await TaskBase64ToMedia(params)
        if (res.data.ret.code === 0) {
          try {
            const resProp = {
              activity_id: params.activity_id,
              media_id: res.data.data.media_id,
              tg: urlobj.tg,
              wxinfo: {
                ...params.wxinfo
              }
            }
            const resp = await createSmartVideo(resProp, this.$root.mediaPath)
            this.loading = false
          } catch (error) {
            this.loading = false
            Dialog.alert({
              message: '创建任务错误 ' + error.message
            })
          }
          
        }
      } catch (error) {
        this.loading = false
        Dialog.alert({
          message: '上传错误 ' + error.message
        })
      }
      
    },
    async loadMore() {
      console.log(this.loading, 'load loading')
      if (this.totalNum <= this.lists.length) {
        this.loading = false
        return;
      }
      this.loading = true
      this.offset ++
      await this.getLists()
      this.loading = false
    },
    // 获取活动信息
    async getProjectById() {
      try {
        const projectProp = {
          openid: this.$root.Config.WXInfo.openid,
          id: +JSON.parse(sessionStorage.urlobj).activity_id
        }
        const res = await GetProjectsList(projectProp, this.$root.mediaPath)
        if (res.data.ret.code === 0) {
          this.content = res.data.data.rows[0]
        }
      } catch (error) {
      }
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
        if (this.totalNum <= this.lists.length) {
          this.finished = true
        }
      } catch (error) {
        
      }
    },
    async getData(offset, limit) {
      try {
        const getProp = {
          openid: this.$root.Config.WXInfo.openid,
          activity_id: +JSON.parse(sessionStorage.urlobj).activity_id,
          offset: offset ? offset : this.offset,
          limit: limit ? limit : this.limit
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
    /**
     * 刷新列表
     */
    refreshHandle() {
      this.refreshList()
    },
    choseHandle(item) {
      this.choselist = item
    },
    appTouch() {
      this.choselist = null
    },
    cancelChose() {
      this.choselist = null
    },
    timeFormat(item) {
      return moment(item.created_at).format('YYYY-MM-DD HH:mm:ss')
    },
    /**
     * 列表项状态format
     */
    statusMsg(item) {
      switch (item.status) {
        case 'init':
          return `处理中, 请等待...`
          break;
        case 'success':
          return `成功`
          break;
        case 'fail':
          return `处理失败: ${item.config.error_msg}`
          break;
      
        default:
          break;
      }
    },
    /**
     * 列表项时长format
     */
    durationFormater(row) {
      let rowtime = +row?.config?.duration
      if (isNaN(rowtime)) {
        return '-'
      } else {
        return calculationFormat((rowtime || 0).toFixed(3) * 1000)
      }
    },
    sizeFormater(row) {
      let rowsize = +row?.config?.size
      if (isNaN(rowsize)) {
        return '-'
      } else {
        return sizeFormat(rowsize)
      }
    },
    viewImage(item) {
      wx.previewImage({
        current: item.userimgurl, // 当前显示图片的http链接
        urls: [item.userimgurl] // 需要预览的图片http链接列表
      });
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
    downloadHandle(item) {
      const userAgent = navigator.userAgent.toLowerCase();
      // 判断是否在微信浏览器中
      if (userAgent.indexOf('micromessenger') !== -1) {
        // 是微信浏览器
        console.log('当前在微信浏览器');
        this.$copyText(item.video_url).then(
          (e) => {
            Toast.success('下载链接复制成功，请在其他浏览器下载');
          },
          (e) => {
            Toast.fail('复制失败');
          }
        );

      } else {
        // 不是微信浏览器
        console.log('当前在其他浏览器');
        let name = item.video_url.substring(item.video_url.lastIndexOf('/')+1, item.video_url.length)
  
        downloadFileByBase64(item.video_url, name)
      }
      
    },
    deleteHandle(item) {
      Dialog.confirm({
        message: '您确定删除该条记录吗',
      }).then( async action => {
        const res = await deleteSmartVideo({
          id: item.id,
          activity_id: +JSON.parse(sessionStorage.urlobj).activity_id
        }, this.$root.mediaPath)
        if (res.data.ret.code === 0) {
          this.offset = 1
          this.getLists()
        }
      });
    },
    configCover(item) {
      if (item?.config?.cover_img) {
        return item.config.cover_img.replace('bmp', 'jpg')
      } else {
        return ''
      }
    },
    /**
     * 通过wx 录制音频
     */
    startRecordHandle() {
      wx.startRecord();
      wx.onVoiceRecordEnd({
      // 录音时间超过一分钟没有停止的时候会执行 complete 回调
        complete: function (res) {
          const localId = res.localId;
          console.log(res, 'voice record end')
        }
      });
    },
    endRecordHandle() {
      let thiz = this
      wx.stopRecord({
        success: function (res) {
          const localId = res.localId;
          thiz.translateRecord(localId)
        },
        error: function (res) {
          alert('error')
        }
      });
    },
    translateRecord(localId) {
      const thiz = this
      wx.translateVoice({
        localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
        isShowProgressTips: 1, // 默认为1，显示进度提示
        success: function (res) {
          thiz.record_result = res.translateResult
          thiz.textinputype = 'keyboard'
          // alert(res.translateResult); // 语音识别的结果
        }
      });
    },
    changeInputType(type) {
      this.textinputype = type;
    }
  }
}
</script>
<style lang="scss">
  .createtask-popup {
    .mint-field {
      width: 90%;
    }
    .record-btn {
      .mint-button-text {
        color: #fff;
      }
    }
  }
</style>
<style lang="scss" scoped>
#app {
  display: flex;
  flex-direction: column;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  padding: .2rem;
  color: #2c3e50;
  font-size: .2rem;
  overflow: hidden;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-image: url('~@/assets/wxImages/home_bg.png');
  .wx-title {
    display: flex;
    flex-direction: row;
    .wx-title-content {
      flex: 1;
      > p {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .wx-title-project {
        font-size: .32rem;
      }
      .wx-title-tip {
        font-size: .19rem;
        // color: #969FA2;
      }
    }
    .wx-title-image{
      width: 1rem;
      height: 1rem;
      border-radius: 100%;
      background-repeat: no-repeat;
      background-size: contain;
      background-position: right center;
    }
  }
  .wx-btn-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-top: .2rem;
    margin-bottom: .2rem;
  }
  .media-lists {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
      display: none; /* 隐藏 WebKit 内核浏览器的滚动条 */
    }
    > div {
      position: relative;
      overflow: hidden;
      padding: .1rem;
      margin-bottom: .1rem;
      border-radius: .06rem;
      &:nth-child(3n+1) {
        background-color: #fff0f6fc;
      }
      &:nth-child(3n+2) {
        background-color: #fff8f8f8;
      }
      &:nth-child(3n+3) {
        background-color: #fffff7f3;
      }
      .item-image {
        display: flex;
        flex-direction: row;
        min-height: 1rem;
        .left-content {
          width: 1.2rem;
          margin-right: .1rem;
          img {
            width: 1.2rem;
            height: 1rem;
            object-fit: contain;
          }
          p {
            line-height: .4rem;
            text-align: center;
          }
        }
        .file-url {
          flex: 1;
          line-height: .24rem;
          font-size: .14rem;
          overflow: hidden;
          > li {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .file-status {
            font-size: .12rem;
            color: #969FA2;
          }
          .sucees-wrapper {
            display: flex;
            height: 0.75rem;
            > div {
              flex: 1;
            }
            div:first-child {
              flex: none;
              width: 1rem;
            }
            img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          }
        }
      }
      .media-btn {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        background-color: rgba(129,140,144,0.3);
        border-radius: .06rem;
        backdrop-filter: blur(.04rem);
        -webkit-backdrop-filter: blur(.04rem);
        > button {
          margin-right: .1rem;
        }
        .mint-button {
          width: .5rem;
          height: .5rem;
          padding: 0;
          border-radius: 100%;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
        }
        .view-btn {
          background-image: url('~@/assets/wxImages/view.png');
        }
        .download-btn {
          background-image: url('~@/assets/wxImages/download.png');
        }
        .delete-btn {
          background-image: url('~@/assets/wxImages/delete.png');
        }
      }
    }
    .upload-btn {
      position: fixed;
      left: 40%;
      bottom: .2rem;
      z-index: 11;
      width: .6rem;
      height: .6rem;
      line-height: .6rem;
      padding: 0;
      border-radius: 100%;
      text-align: center;
      font-size: .3rem;
      color: #fff;
      background-color: #00B1FF !important;
    }
  }
  .mint-popup {
    width: 100%;
    height: 75%;
    .img-delete {
      position: absolute;
      height: 30px;
      padding: 0 7px;
      background-color: #b77272;
    }
  }
  .createtask-popup {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 70%;
    padding: .2rem .1rem;
    .record-btn {
      width: 1rem;
      height: .5rem;
      border-radius: 0.16rem;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      -webkit-touch-callout: none;
      background-repeat: no-repeat;
      background-size: .4rem;
      background-image: url('~@/assets/wxImages/volice.jpeg');
    }
    .keyboard-btn {
      @extend .record-btn;
      background-image: url('~@/assets/wxImages/keyboard.jpeg');
    }
  }
}

</style>
