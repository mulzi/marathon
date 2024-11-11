import axios from 'axios'
// import router from '@/router/index'
import { Message } from 'element-ui'
let $axio = null

class Axio {
  $axio = null;
  constructor (baseUrl) {
    this.$axio = axios.create({
      baseURL: baseUrl,
    })
    this.$axio.interceptors.request.use(
      function(config) {
        //在请求发出之前进行一些操作
        let token = sessionStorage.token;
        if (token) {
          config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
      },
      function(err) {
        // Do something with request error
        return Promise.reject(error);
    });
    this.$axio.interceptors.response.use(
      response => {
        if (response?.data?.ret?.code !== 0) {
          Message.error({
            message: `${response.data.ret.cn}`
          });
          if (response?.data?.ret?.code === 10041 && localStorage.typepage !== 'wxpage') {
            if (window.top === window.self) {
              const jsPanelEle = document.querySelector('.jsPanel')
              if (jsPanelEle) {
                jsPanelEle.close();
              }
              sessionStorage.clear()
              if (window.$config.loginUrl) {
                location.href = window.$config.loginUrl
              }else {
                // router.replace('/login')
              }
            }
          }
        }
        return response;
      },
      async error => {
        if (error?.response) {
          switch (error?.response?.status) {
            case 401: case 403:
              // 返回 401 清除token信息并跳转到登录页面
              if (localStorage.typepage !== 'wxpage') {
                if (window.top === window.self) {
                  const jsPanelEle = document.querySelector('.jsPanel')
                  if (jsPanelEle) {
                    jsPanelEle.close();
                  }
                  sessionStorage.clear()
                  if (window.$config.loginUrl) {
                    location.href = window.$config.loginUrl
                  }else {
                    // router.replace('/login')
                  }
                }
              }
            break;
          }
        }
        return Promise.reject(error.response.data)   // 返回接口返回的错误信息
    });
  }

  getAxio () {
    return this.$axio
  }
}

const AxioInit = (baseURL) => {
  $axio = new Axio(baseURL).getAxio()
}

export {
  Axio,
  AxioInit,
  $axio
}
