<template>
  <div class="products-wrapper">

    <div class="media-lists">

      <div class="top-img">
        <img src="../../assets/wxImages/image/top_o1.png" alt="">
      </div>
      <van-pull-refresh  v-model="refreshing" @refresh="refreshList">
        <van-list
            v-model="loading"
            :finished="finished"
            finished-text=""
            @load="loadMore"
        >
          <div class="media-item-box">
            <VideoList v-for="item in lists" :key="item.id + item.created_at" :title="item" :item="item">
            </VideoList>
          </div>
        </van-list>
      </van-pull-refresh>

      <div class="b-b-img">
        <img src="../../assets/wxImages/image/b_b.png" alt="">
      </div>
    </div>

    <div class="right-r" @click="goHome">
      <p>再来</p>
      <p>一段</p>
    </div>

  </div>
</template>

<script>
import { ProductList, getDspWeixinInfo } from '@/api/projects.js'
import VideoList from "@/wx/views/VideoList.vue";
import Vue from 'vue'
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
      priviewInfo: {
        file_url: ''
      },
    }
  },
  components:{
    VideoList
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
    goHome() {
      this.$router.replace({
        path: '/home'
      })
    },

  }
}
</script>

<style lang="scss" scoped>
.products-wrapper {
  overflow-y:scroll ;
  background: rgba(46,182,244,045);

  .right-r{
    position: fixed;
    bottom: 18%;
    right: 2.5%;
    width: 0.8rem;
    height: 0.8rem;
    background:#0081F5 ;
    border-radius: 0.1rem;
    text-align: center;
    box-shadow: 0 0.08rem 0.1rem rgba(0,0,0,.3);
    p{
      font-size: 0.24rem;
      color: #FFFFFF;
      &:nth-child(1){
        margin-top: 0.1rem;
      }
    }
  }
  .media-lists {
    height: 100vh;
    .top-img{
      width: 100%;
      padding-top: 0.5rem;
      margin-bottom: 0.3rem;
      overflow: hidden;
      img{
        display: block;
        width: 100%;
      }
    }
    .b-b-img{
      width: 100%;
      padding-bottom: 0.6rem;
      overflow: hidden;
      img{
        display: block;
        width: 100%;
      }
    }
    &::-webkit-scrollbar {
      display: none; /* 隐藏 WebKit 内核浏览器的滚动条 */
    }
  }
}
</style>
