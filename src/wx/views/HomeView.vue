<template>
  <div id="wx-home">
    <div class="wx-content">
      <div class="wx-image">
        <div class="wx-image-line">
          <div class="wx-image">
            <img v-if="imgurl" :src="imgurl" alt="">
          </div>
        </div>
      </div>
      <div class="wx-message" v-if="false" :class="{
        'animate__animated': task_status === 'success',
        'animate__pulse': task_status === 'success',
        'animate__infinite': task_status === 'success'
      }">
        {{ wxmessage }}
      </div>
    </div>
    <div class="wx-tips">
      <div class="wx-tips-box">
        <div class="wx-tips-image sun"></div>
        <div class="wx-tips-title">光线充足</div>
      </div>
      <div class="wx-tips-box">
        <div class="wx-tips-image eyes"></div>
        <div class="wx-tips-title">正对镜头</div>
      </div>
      <div class="wx-tips-box">
        <div class="wx-tips-image noface"></div>
        <div class="wx-tips-title">不遮挡面部</div>
      </div>
      <div class="wx-tips-box" @click.stop.prevent="goProductsHandler">
        <div class="wx-tips-image products"></div>
        <div class="wx-tips-title">查看成品</div>
      </div>
      <div class="wx-tips-box" @click.stop.prevent="freshHandler">
        <div class="wx-tips-image refresh"></div>
        <div class="wx-tips-title">刷新</div>
      </div>
    </div>
    <div class="wx-control">
      <van-field v-if="searchtypes.includes('number_plate')"
        :disabled="!checked || ['running', 'success'].includes(task_status)"
        class="control-button primary-control wx-plate-number"
        v-model="platenumber" label="号码牌">
        <template #button>
          <van-button size="small" type="default"
            :disabled="!checked || ['running', 'success'].includes(task_status)"
            @click.stop="startTask">抽取视频</van-button>
        </template>
      </van-field>
      <van-button v-if="searchtypes.includes('face')"
        class="control-button primary-control" type="default" block
        :disabled="!checked || ['running', 'success'].includes(task_status)"
        @click.stop="uploadHandle"
      >{{ uploadmessage }} 
        <span v-if="searchtypes.includes('number_plate')" class="upload-optional">
          (可选)
        </span>
      </van-button>
      <van-button class="control-button default-control" type="default" block
        @click.stop="goProducts">精选视频，编号获取</van-button>
    </div>
    <footer class="wx-footer">
      <van-checkbox v-model="checked" @change="checkedHandle">
        同意视频采集并为本人二次传播承担责任。
        <template #icon="props">
          <div class="img-icon" :class="{
            'activeIcon': props.checked
          }"></div>
        </template>
      </van-checkbox>
    </footer>
  </div>
</template>

<script>
import Vue from 'vue'
import { Toast } from 'vant';
import { downloadFileByBase64, calculationFormat, sizeFormat } from '@/unit/index.js'

import { ProductList, createSmartVideo, deleteSmartVideo, GetProjectsList } from '@/api/projects.js'
import { TaskBase64ToMedia } from '@/api/task.js'

export default {
  name: 'WxHomeView',
  computed: {
    wxmessage: function() {
      let str = '获取视频'
      switch(this.task_status) {
        case 'running':
          str = '正在生成视频， 请耐心等待'
          break;
        case 'success':
          str = '正在生成视频， 请耐心等待'
          break;
      }
      return str
    },
    uploadmessage: function() {
      let str = '开始扫脸'
      switch(this.task_status) {
        case 'running':
          str = '重新扫脸'
          break;
        case 'success':
          str = '重新扫脸'
          break;
      }
      return str
    },
    searchtypes: function() {
      if (window.$config.WXInfo?.searchtypes) {
        return window.$config.WXInfo.searchtypes
      } else {
        return []
      }
    }
  },
  data() {
    return {
      content: {}, // 活动详情
      checked: false,
      loading: false,
      task_status: '',
      limit: 5,
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
          name: '抽取短视频',
          method: this.uploadMessage
        },
        // {
        //   name: '上传图片sss',
        //   method: this.uploadHandle
        // },
        // {
        //   name: '输入图片标识',
        //   method: this.inputHandle
        // }
      ],
      dialogVisible: false,
      imgurl: '',
      random_str: '',
      platenumber: '',
    }
  },
  created() {
    this.getLists()
    if (localStorage.checked === 'true') {
      this.checked = true
    } else {
      this.checked = false
    }
  },
  mounted() {
    const thiz = this
    Vue.prototype.mediaUpload.$socket_io.on('smart_video_status', function(val) {
      if (val.openid === thiz.$root.Config.WXInfo.openid) {
        thiz.refreshList()
        if (['success', 'fail'].includes(val.status) && thiz.$route.path !== '/products') {
          thiz.$router.push({
            path: '/products'
          })
        }
      }
    })
  },
  beforeDestroy() {
    if (window.freshInterval) {
      clearTimeout(window.freshInterval)
      window.freshInterval = null
    }
  },
  methods: {
    checkedHandle(val) {
      this.checked = val
      localStorage.checked = val
    },
    createTask() {
      this.sheetVisible = true
    },
    uploadMessage() {
      this.dialogVisible = true
    },
    deleteImageHandle() {
      this.imgurl = ''
    },
    goProducts() {
      this.$router.push('searchproducts')
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
              thiz.startTask()
            }
          });
        }
      });
    },
    async startTask() {
      let image_id = null
      const wxinfo = this.$root.Config.WXInfo
      const urlobj = JSON.parse(sessionStorage.urlobj)
      if (this.imgurl) {
        // 存在上传图片, 需要上传到media，获取media ID
        this.task_status = 'running';
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
        if (this.$root.Config.WXInfo.code_mark_str) {
          Object.assign(params, {
            code_mark_str: this.$root.Config.WXInfo.code_mark_str
          })
        }
        
        const res = await TaskBase64ToMedia(params)
        if (res.data.ret.code === 0) {
          image_id = res.data.data.media_id
          this.task_status = 'success';
        } else {
          this.task_status = ''
          return
        }
      }
      console.log(!image_id, this.platenumber, 'start ')
      if (!image_id && !this.platenumber) {
        this.task_status = ''
        return;
      }
      try {
        this.task_status = 'success';
        const resProp = {
          activity_id: +urlobj.activity_id,
          tg: urlobj.tg,
          wxinfo: {
            ...wxinfo
          }
        }
        if (image_id) {
          Object.assign(resProp, {
            media_id: image_id,
          })
        }
        if (this.$root.Config.WXInfo.code_mark_str) {
          Object.assign(resProp, {
            code_mark_str: this.$root.Config.WXInfo.code_mark_str
          })
        }
        if (this.platenumber) {
          Object.assign(resProp, {
            text: {
              text: this.platenumber
            }
          })
        }
        const resp = await createSmartVideo(resProp, this.$root.mediaPath)
        if (resp.data.ret.code) {
          this.task_status = '';
          Toast(resp.data.ret.cn);
        } else {
          const timeoutFresh = () => {
            if (window.freshInterval) {
              clearTimeout(window.freshInterval)
            }
            window.freshInterval = setTimeout(async () => {
              await this.getLists()
              if (this.lists.length > 0) {
                const hasrunning = this.lists.filter(row => row.status === 'init')
                if (!hasrunning?.length && this.$route.path !== '/products') {
                  this.$router.push({
                    path: '/products'
                  })
                } else {
                  timeoutFresh()
                }
              }
            }, 5000)
          }
          timeoutFresh()
        }
      } catch (error) {
        // alert(error.message)
      }
    },
    async createSmartTask() {
      if ( !this.imgurl && !this.random_str && !this.platenumber ) {
        MessageBox('请至少填写一项');
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
          if (this.$root.Config.WXInfo.code_mark_str) {
            Object.assign(params, {
              code_mark_str: this.$root.Config.WXInfo.code_mark_str
            })
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
        if (this.$root.Config.WXInfo.code_mark_str) {
          Object.assign(resProp, {
            code_mark_str: this.$root.Config.WXInfo.code_mark_str
          })
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
        const resp = await createSmartVideo(resProp, this.$root.mediaPath)
        if (resp.data.ret.code) {
          MessageBox(resp.data.ret.cn);
        }
        this.loading = false
        this.dialogVisible = false
      } catch (error) {
        this.loading = false
        this.dialogVisible = false
        MessageBox('创建任务错误', error.message);
      }
    },
    goProductsHandler() {
      if (this.$route.path !== '/products') {
        this.$router.push({
          path: '/products',
        })
      }
    },
    async freshHandler() {
      await this.getLists()
      if (this.lists.length > 0) {
        const hasrunning = this.lists.filter(row => row.status === 'init')
        if (!hasrunning?.length && this.$route.path !== '/products') {
          this.$router.push({
            path: 'products'
          })
        }
      }
    },
    inputHandle() {
      MessageBox.prompt('请输入唯一标识').then(async ({ value, action }) => {
        this.loading = true
        try {
          const wxinfo = this.$root.Config.WXInfo
          const urlobj = JSON.parse(sessionStorage.urlobj)
          const resProp = {
            activity_id: +urlobj.activity_id,
            random_str: value,
            wxinfo: {
              ...wxinfo
            }
          }
          if (this.$root.Config.WXInfo.code_mark_str) {
            Object.assign(resProp, {
              code_mark_str: this.$root.Config.WXInfo.code_mark_str
            })
          }
          const resp = await createSmartVideo(resProp, this.$root.mediaPath)
          this.loading = false
        } catch (error) {
          this.loading = false
          MessageBox('创建任务错误', error.message);
        }
      });
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
        if (this.$root.Config.WXInfo.code_mark_str) {
          Object.assign(params, {
            code_mark_str: this.$root.Config.WXInfo.code_mark_str
          })
        }

        const res = await TaskBase64ToMedia(params)
        if (res.data.ret.code === 0) {
          try {
            const resProp = {
              activity_id: params.activity_id,
              media_id: res.data.data.media_id,
              wxinfo: {
                ...params.wxinfo
              }
            }
            if (this.$root.Config.WXInfo.code_mark_str) {
              Object.assign(resProp, {
                code_mark_str: this.$root.Config.WXInfo.code_mark_str
              })
            }
            const resp = await createSmartVideo(resProp, this.$root.mediaPath)
            this.loading = false
          } catch (error) {
            this.loading = false
            MessageBox('创建任务错误', error.message);
          }
          
        }
      } catch (error) {
        this.loading = false
        MessageBox('上传错误', error.message);
      }
      
    },
    async loadMore() {
      if (this.totalNum <= this.lists.length) {
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
          id: +JSON.parse(sessionStorage.urlobj).activity_id,
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
        this.initTaskStatus()
      } catch (error) {
        
      }
    },
    initTaskStatus() {
      if (this.lists.length > 0) {
        try {
          const hasrunning = this.lists.filter(row => row.status === 'init')
          if (hasrunning?.length) {
            if (hasrunning[0]?.userimgurl) {
              this.imgurl = hasrunning[0].userimgurl
            }
            this.task_status = 'success'
            const timeoutFresh = () => {
              if (window.freshInterval) {
                clearTimeout(window.freshInterval)
              }
              window.freshInterval = setTimeout(async () => {
                await this.getLists()
                if (this.lists.length > 0) {
                  const hasrunning = this.lists.filter(row => row.status === 'init')
                  if (!hasrunning?.length && this.$route.path !== '/products') {
                    this.$router.push({
                      path: '/products'
                    })
                  } else {
                    timeoutFresh()
                  }
                }
              }, 5000)
            }
            timeoutFresh()
          }
        } catch (error) {
          console.error(error)
        }
      } else {
        this.task_status = ''
      }
    },
    async getData(offset, limit) {
      try {
        const getProp = {
          openid: this.$root.Config.WXInfo.openid,
          activity_id: +JSON.parse(sessionStorage.urlobj).activity_id,
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
    deleteHandle(item) {
      MessageBox.confirm(`您确定删除该条记录吗`).then( async action => {
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
      alert('translate')
      wx.translateVoice({
        localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
        isShowProgressTips: 1, // 默认为1，显示进度提示
        success: function (res) {
          alert(res.translateResult); // 语音识别的结果
        }
      });
    }
  }
}
</script>

<style lang="scss">
  #wx-home {
    .wx-footer {
      .van-checkbox__label {
        color: #5F5F5F;
      }
    }
    .wx-plate-number {
      .van-field__label, .van-field__control {
        color: #fff;
      }
      .van-button {
        display: flex;
        border: none;
        font-size: .14rem;
        line-height: 1;
        border-radius: .14rem;
        color: #fff;
        background-color: sienna;
      }
    }
  }
</style>

<style lang="scss" scoped>
  #wx-home {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: center;
    background-image: url('~@/assets/wxImages/home_bg.png');
    .wx-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 4.6rem;
      padding-top: .1rem;
      .wx-image {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 3.5rem;
        .wx-image-line {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 3.2rem;
          height: 3.2rem;
          background: url('~@/assets/wxImages/face_line.png') center / 3.2rem 3.2rem no-repeat;
          .wx-image {
            width: 2.6rem;
            height: 2.6rem;
            background: url('~@/assets/wxImages/face.png') center / 1.2rem 1.6rem no-repeat,
              url('~@/assets/wxImages/face_bg.png') center / 2.6rem 2.6rem no-repeat;
            overflow: hidden;
            img {
              width: 2.6rem;
              height: 2.6rem;
              border-radius: 50%;
              object-fit: cover;
            }
          }
        }
      }
      .wx-message {
        flex: 1;
        width: 2.4rem;
        font-size: .17rem;
        text-align: center;
        color: #005C96;
        animation-duration: 5s;
        animation-delay: 2s;
      }
    }
    .wx-tips {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      height: .8rem;
      padding: 0 .2rem;
      .wx-tips-box {
        display: flex;
        flex-direction: column;
        width: 1rem;
        .wx-tips-image {
          height: .8rem;
          background-repeat: no-repeat;
          background-size: .4rem;
          background-position: center;
          &.sun {
            background-image: url('~@/assets/wxImages/sun.png');
          }
          &.eyes {
            background-image: url('~@/assets/wxImages/eyes.png');
          }
          &.noface {
            background-image: url('~@/assets/wxImages/noface.png');
          }
          &.refresh {
            background-image: url('~@/assets/wxImages/sync.svg');
          }
          &.products {
            background-size: .38rem;
            background-image: url('~@/assets/pcImages/template/ic_dashboard_bl.svg');
          }
        }
        .wx-tips-title {
          flex: 1;
          text-align: center;
          font-size: .14rem;
          color: #333;
        }
      }
    }
    .wx-control {
      min-height: 1.7rem;
      padding: .1rem 0;
      .control-button {
        height: .8rem;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        border: none;
        &::before {
          display: none;
        }
      }
      .primary-control {
        color: #fff;
        background-image: url('~@/assets/wxImages/button_primary.png');
      }
      .default-control {
        color: #005C96;
        background-image: url('~@/assets/wxImages/button_default.png');
      }
      .wx-plate-number {
        padding: 0 .3rem;
        line-height: .7rem;
      }
      .upload-optional {
        position: absolute;
        right: .36rem;
      }
    }
    .wx-footer {
      flex: 1;
      padding: .2rem .2rem;
      font-size: .14rem;
      .img-icon {
        width: .2rem;
        height: .2rem;
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        background-image: url('~@/assets/wxImages/noagree.png');
        &.activeIcon {
          background-image: url('~@/assets/wxImages/agree.png');
        }
      }
    }
  }
</style>
