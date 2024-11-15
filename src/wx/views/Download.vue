<template>
  <div class="download">
    <div class="img" v-if="flag">
      <img src="../../assets/wxImages/image/21222.png" alt="">
    </div>



  </div>
</template>

<script>

import {Dialog} from "vant";
import {downloadFileByBase64} from "@/unit";

export default {
  name: "products",
  data() {
    return {
      flag:true
    }
  },
  mounted() {
    this.download()
  },
  methods: {
     download(){
       const that = this
       const userAgent = navigator.userAgent.toLowerCase();
       // 判断是否在微信浏览器中
       if (userAgent.indexOf('micromessenger') !== -1) {
         this.flag = true
       } else {
         this.flag = false
         const url = this.$route.query.downloadUrl
         let name = url.substring(url.lastIndexOf('/')+1, url.length)
         downloadFileByBase64(url, name)

         setTimeout(()=>{
           Dialog.alert({
             title: '提示',
             message: '正在下载,请稍等！点击返回！'
           }).then(() => {
             that.$router.push({
               path: '/products',
             })
           });
         },1500)

       }

     }
  }
}
</script>

<style lang="scss" scoped>
.download{
  height: 100vh;
  background: rgba(0,0,0,.2);
  .img{
    float: right;
    margin-top: 0.5rem;
  }
}
</style>
