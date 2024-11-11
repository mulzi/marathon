<template>
  <div class="products-wrapper">
    <header class="products-header">
      获取视频
    </header>
    <section class="products-search">
      <div class="search-image"></div>
      <van-field class="media-id-input" clear-trigger="always"
        v-model="media_id" @focus="focusInput"
        clearable placeholder="请输入视频编号获取视频" />
      <div v-if="showerror" class="media-search-error">
        <van-icon name="warning" /><span>没找到对应视频，请核对或重新输入～</span>
      </div>
      <div v-else class="media-search-error"></div>
      <van-button class="control-button primary-control" type="default" block
        @click.stop.prevent="getData"
      >确定</van-button>
      <van-cell class="productsview-link" title="更多精彩视频" is-link to="productsview" />
    </section>
  </div>
</template>

<script>
import { ProductList, createSmartVideo, deleteSmartVideo, GetProjectsList } from '@/api/projects.js'
import { downloadFileByBase64, calculationFormat, sizeFormat } from '@/unit/index.js'
import { Toast } from 'vant';
export default {
  name: "searchproducts",
  data() {
    return {
      limit: 100,
      offset: 1,
      totalNum: 0,
      lists: [],
      loading: false,
      refreshing: false,
      finished: false,
      uploadlimit: 0,
      popupVisible: false,
      priviewInfo: {
        file_url: ''
      },
      media_id: '',
      showerror: false
    }
  },
  methods: {
    focusInput() {
      this.showerror = false
    },
    async getData() {
      try {
        if (!this.media_id) {
          Toast('请输入视频编号');
          return 
        }
        const getProp = {
          openid: this.$root.Config.WXInfo.openid,
          // activity_id: +JSON.parse(sessionStorage.urlobj).activity_id,
          offset: this.offset,
          limit: this.limit,
          id: +this.media_id,
          increment_to_user: true
        }

        const res = await ProductList(getProp, this.$root.mediaPath)

        if (res.data.ret.code === 0) {
          const { rows, count } = res.data.data
          if (!rows?.length) {
            this.showerror = true
          }
          this.$router.push({
            path: '/products',
            query: {
              id: +this.media_id
            }
          })
          return { rows, count }
        } else {
          this.showerror = true
        }
      } catch (error) {
        return {}
      }
    },
  }
}
</script>

<style lang="scss">
.products-wrapper {
  .products-search {
    .media-id-input {
      .van-field__control {
        color: #fff;
      }
    }
    .productsview-link {
      .van-cell__title {
        display: inline-block;
        flex: none;
      }
    }
  }
}
</style>

<style lang="scss" scoped>
.products-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 .2rem;
  overflow: hidden;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-image: url('~@/assets/wxImages/home_bg_black.png');
  .products-header {
    flex: none;
    height: 1rem;
    line-height: 1rem;
    color: #fff;
    font-size: .16rem;
    text-align: center;
  }
  .products-search {
    flex: 1;
    .search-image {
      width: 2.6rem;
      height: 2rem;
      margin: 0 auto .2rem;
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
      background-image: url('~@/assets/wxImages/searchlogo.png');
    }
    .media-id-input {
      width: calc(100% - .4rem);
      margin: auto;
      background: rgba(0,0,0,0.1);
      border-radius: 12px;
      &::after {
        display: none;
      }
    }
    .media-search-error {
      padding-top: .1rem;
      font-size: .14rem;
      color: #F7B500;
      text-align: center;
    }
    .control-button {
      margin-top: .6rem;
      height: .85rem;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      background-color: transparent;
      border: none;
      padding: 0;
      &::before {
        display: none;
      }
    }
    .primary-control {
      color: #fff;
      background-image: url('~@/assets/wxImages/button_primary.png');
    }
    .productsview-link {
      display: flex;
      justify-content: center;
      background: transparent;
      color: #fff;
      i {
        color: #fff;
      }
    }
  }
}
</style>