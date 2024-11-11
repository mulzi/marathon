<template>
  <div id="app">
    <router-view v-if="goRoute" />
  </div>
</template>

<script>
import { ProductList, GetProjectsList } from '@/api/projects.js'

export default {
  name: 'WxApp',
  async created() {
    // await this.getProjectById()
    // const goRoute = await this.judgeHandler()
    // if (this.$route.path !== goRoute) {
    //   this.$router.replace({
    //     path: goRoute
    //   })
    // }
    // this.goRoute = goRoute
  },
  data() {
    return {
      goRoute: ''
    }
  },
  methods: {
    async judgeHandler() {
      let route = '/home'
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
        if (rows.length > 0) {
          const hasrunning = rows.filter(row => row.status === 'init')
          if (!hasrunning?.length) {
            route = '/products'
          }
        }
      }
      return route
    },
    /**
     * 获取活动信息
     *
     */
    async getProjectById() {
      try {
        const urlobj = JSON.parse(sessionStorage.urlobj)
        const projectProp = {
          id: +urlobj.activity_id,
        }
        const res = await GetProjectsList(projectProp, this.$root.mediaPath)
        if (res.data.ret.code === 0) {
          const projectObject = res.data.data.rows[0]
          if (projectObject.code_mark_str) {
            Object.assign(window.$config.WXInfo, {
              code_mark_str: projectObject.code_mark_str
            })
          }
          if (projectObject.activity_mark_str) {
            Object.assign(window.$config.WXInfo, {
              activity_mark_str: projectObject.activity_mark_str
            })
          }
          if (projectObject.type) {
            Object.assign(window.$config.WXInfo, {
              type: projectObject.type
            })
          }
          if (projectObject?.config?.modeling?.searchtypes) {
            Object.assign(window.$config.WXInfo, {
              searchtypes: projectObject.config?.modeling?.searchtypes
            })
          }

        }
      } catch (error) {

      }
    },
  }
}
</script>
<style lang="scss" scoped>
#app {
  position: fixed;
  width: 100%;
  height: 100%;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  box-sizing: border-box;
  color: #2c3e50;
  font-size: .2rem;
  overflow: hidden;
  min-height: 100vh;
  overflow: auto;
}
</style>
