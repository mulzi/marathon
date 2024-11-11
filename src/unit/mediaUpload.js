/*
 * @Author: zhangyong
 * @Date:   2020-03-04
 * @Descrition : 媒资上传组件
 */

// 引入项目的配置信息
import axios from 'axios';
import SparkMD5 from 'spark-md5';
import io from 'socket.io-client';
import crc32 from 'crc-32';

let upload_num = 0;
let upload_limit = 0;

// 媒资大文件上传 (使用 es6 的语法)
class MediaUpload {
  /**
   * 构造函数
   * @param params 传递进来的方法
   */
  constructor(options, $socket_io) {
    // this.userInfo = userInfo;
    this.options = options;

    // 设置媒资上传的前缀域名
    if (options.url) {
      this.origin_url = options.url
    } else {
      throw Error('缺少url前缀')
    }
    // if (options.token) {
    //   this.token = options.token
    // } else {
    //   throw Error('缺少token')
    // }
    this.token = sessionStorage.getItem('token');
    this.path = options.mediaPath + '/';
    this.$axios = axios.create({
      baseURL: this.origin_url
    });
    this.$axios.interceptors.request.use(
      function(config) {
        //在请求发出之前进行一些操作
        if (options.token) {
          config.headers.Authorization = 'Bearer ' + sessionStorage.getItem('token');// options.token
        }
        return config;
      },
      function(err) {
        // Do something with request error
        return Promise.reject(error);
      }
    );

    this.file = null;
    this.params = {};
    this.fileSize = 0;
    this.fileMd5Value = null;
    this.chunks = 0;
    this.chunkSize = 5 * 1024 * 1024; // 10Mb

    this.obj_arr = []

    this.$socket_io = null
    if($socket_io){
      this.$socket_io = $socket_io
      this.out_socket_io = true
    } else {
      this.$socket_io = io(this.origin_url, {
        path: options.mediaSocket + '/socket.io',
        transports: ["websocket"],
        extraHeaders: {
          Authorization: "Bearer " + this.token
        },
        query: {
          token: this.token,
        }
      });
    }

    let that = this;
    this.$socket_io.on("fileToolMergeFile_over", (res) => {
      for(let obj of that.obj_arr){
        obj.socket_merge_file_over(res)
      }
    })
    this.$socket_io.on("media_prepro_ratio", (res) => {
      // let obj = this.getobj({media_id: res.id})
      for(let obj of that.obj_arr){
        obj.socket_media_prepro_ratio_callback(res)
      }
    })

    this.$socket_io.on("media_upload", (res) => {
      // let obj = this.getobj({media_id: res.id})
      for(let obj of that.obj_arr){
        obj.socket_media_update_callback(res)
      }
    })

    this.$socket_io.on("media_http_progress", (res) => {
      // let obj = this.getobj({media_id: res.id})
      for(let obj of that.obj_arr){
        obj.socket_media_http_progress(res)
      }
    })

    this.$socket_io.on("media_ftp_download", (res) => {
      // let obj = this.getobj({media_id: res.id})
      for(let obj of that.obj_arr){
        obj.socket_media_ftp_progress(res)
      }
    })
  }

  getobj(params){
    for(let obj of this.obj_arr){
      if(obj.get(params)){
        return obj
      }
    }

    return false
  }

  deleteObj(params){
    for(let index in this.obj_arr){
      if(this.obj_arr[index].get(params)){
        this.obj_arr.splice(index, 1)
      }
    }
    return true
  }

  /**
   * 分片上传大文件接口
   */
  multipartUpload(file, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(file && file.raw){
          file = file.raw
        }

        if(!(file instanceof File)){
          throw Error('参数错误')
        }
        break;
    }

    // 开始上传
    // await multipartUploadStart()

    let _multipartUpload = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    this.windowsPostUpdateToken()

    _multipartUpload.multipartUpload(file, params, function(token) {
      if(that.token != token) {
        that.token = token
        console.log('--------reconnected')
        // that.$socket_io.close()
        // that.$socket_io = io(that.origin_url, {
        //   path: '/api/v1/media' + '/socket.io/?token=' + that.token,
        //   extraHeaders: {
        //     Authorization: "Bearer " + that.token
        //   }
        // });
      }
    })

    this.obj_arr.push(_multipartUpload)

    return _multipartUpload
  }

  /**
   * 单文件上传
   * @param {*} file // 文件对象
   * @param {*} params // 上传参数对象
   */
  formUploadStart(file, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(file && Array.isArray(file)){
          throw Error('文件错误') 
        }
        if(file && file.raw){
          file = file.raw
        }

        if(!(file instanceof File)){
          throw Error('参数错误')
        }
        break;
    }

    let _formUploadStart = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    _formUploadStart.formUploadStart(file, params)
    this.obj_arr.push(_formUploadStart)

    return _formUploadStart
  }

  /**
   * 图片序列上传
   * @param {*} file // 文件对象
   * @param {*} params // 上传参数对象
   */
  imageSequenceUpload(file_list, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        // this.params = params
        // this.fileSize = file.size
        break;
    }

    that.windowsPostUpdateToken()

    let _imageSequenceUpload = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    if(!params){
      params = {}
    }
    params.media_type = 'image_array'

    _imageSequenceUpload.imageSequenceUpload(file_list, params)
    this.obj_arr.push(_imageSequenceUpload)

    return _imageSequenceUpload
  }

  /**
   * ai文件上传
   * @param {*} file_list // 文件对象数组
   * @param {*} params // 上传参数对象
   */
  aiFileUpload(file_list, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(file_list && !Array.isArray(file_list)){
          throw Error('参数错误')
        }
        break;
    }

    let _aiFileUpload = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    _aiFileUpload.aiFileUpload(file_list, params)

    return _aiFileUpload
  }

  /**
   * 自定义文件上传
   * @param {*} file // 文件对象
   * @param {*} action_name // 自定义actions
   * @param {*} params // 上传参数对象
   */
  customUpload(file, action_name, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(file && Array.isArray(file)){
          throw Error('文件错误') 
        }
        if(file && file.raw){
          file = file.raw
        }

        if(!(file instanceof File)){
          throw Error('参数错误')
        }
        break;
    }

    let _customUpload = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    _customUpload.customUpload(file, action_name, params)

    return _customUpload
  }

  /**
   * http下载
   * @param {*} http_params // 文件对象
   * @param {*} params // 上传参数对象
   */
  httpDownload(http_params, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(!(http_params && http_params.url)){
          throw Error('参数错误') 
        }
        break;
    }

    let obj = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    obj.httpDownload(http_params, params)
    this.obj_arr.push(obj)

    return obj
  }

  /**
   * http下载
   * @param {*} ftp_params // 文件对象
   * @param {*} params // 上传参数对象
   */
  ftpDownload(ftp_params, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(!(ftp_params && ftp_params.path)){
          throw Error('参数错误') 
        }
        break;
    }

    let obj = new UploadMethod({
      origin_url: this.origin_url,
      token: this.token,
      path: this.path,
      $axios: this.$axios,
      chunkSize: this.chunkSize, // 10Mb

      // 暂停: 'pause'
      // 开始: 'start'
      // md5进度: 'md5_progress'
      // 文件上传进度: 'upload_progress'
      // 文件合成进度: 'merge_progress'
      events: this.events,

      $socket_io: this.$socket_io,
    })

    obj.ftpDownload(ftp_params, params)
    this.obj_arr.push(obj)

    return obj
  }

  /**
   * 注销
   */
  close() {
    if(this.$socket_io){
      try {
        if(!this.out_socket_io){
          this.$socket_io.close()
        }
      } catch (err) {
        console.log(err)
      }
    }
  }

  /**
   * 触发判断是否token快过期
   */
  windowsPostUpdateToken() {
    if (!window.checkToken) return;
    let that = this
    if (top.location != self.location) {
      window.parent.postMessage(
        // 子传父
        {
          type: 'updateToken',
          origin: 'mediaUpload'
        },
        '*'
      );
    }else {
      window.checkToken ()
    }

    that.token = sessionStorage.getItem('token')

    if(that.token != sessionStorage.getItem('token')) {
      console.log('--------reconnected')
      // that.$socket_io.close()

      // that.$socket_io = io(that.origin_url, {
      //   path: '/api/v1/media' + '/socket.io/?token=' + that.token,
      //   extraHeaders: {
      //     Authorization: "Bearer " + that.token
      //   }
      // });
    }
  }

}

class UploadMethod {
  constructor(options) {
    this.origin_url = options.url
    this.token = options.token
    this.path = options.path;
    this.$axios = options.$axios
    this.$socket_io = options.$socket_io;

    this.type = null

    this.media_id = null;
    this.action_name = null
    this.other_params = null;
    this.file = null;
    this.params = null;
    this.fileSize = null;
    this.fileMd5Value = null;
    this.chunks = 0;
    this.chunkSize = options.chunkSize; // 10Mb

    // 开始执行
    this.this_start = false

    // 上传是否暂停和开始上传
    this.is_upload_start = false;

    // 暂停: 'pause'
    // 开始: 'start'
    // md5进度: 'md5_progress'
    // 文件上传进度: 'upload_progress'
    // 文件合成进度: 'merge_progress'
    this.events = {};
    this.serviceHost = null,
    this.callback
  }

  // 监听回调方法
  on(key, callback) {
    if(typeof key === 'string' && typeof callback === 'function'){
      this.events[key] = callback
    } else {
      throw('--->>> 参数错误')
    }
  }

  emit(key) {
    switch (key) {
      case 'start':
        if(!this.this_start){
          if(this.this_start){
            return
          }
          this.this_start = true

          switch (this.type) {
            case 'formUploadStart':
              this.formUploadStart(this.file, this.params)
              break;

            case 'imageSequenceUpload':
              this.imageSequenceUpload(this.file, this.params)
              break;

            case 'aiFileUpload':
              this.aiFileUpload(this.file, this.params)
              break;

            case 'customUpload':
              this.customUpload(this.file, this.action_name, this.params)
              break;

            case 'httpDownload':
              this.httpDownload(this.other_params, this.params)
              break;

            case 'ftpDownload':
              this.ftpDownload(this.other_params, this.params)
              break;

            case 'multipartUpload':
              // 开始上传
              this.multipartUploadStart()
              break;
          
            default:
              break;
          }
          
        } else {
          this.this_start = true;
          this.is_upload_start = true;
        }
        break;
      case 'pause':
        // this.this_start = false;
        this.is_upload_start = false;
        if(this.events['pause']){
          this.events['pause']({fileMd5Value: this.fileMd5Value})
        }
        break;

      case 'fileToolMergeFile_over':
        this.this_start = false;
        this.is_upload_start = false;
        break;
    
      default:
        throw('--->>> 不存在该事件')
        break;
    }
  }

  get(params){
    let flag = false
    if(params && params.media_id && params.media_id == this.media_id){
      flag = true
    }
    if(params && params.media_id && params.media_id != this.media_id){
      flag = false
    }
    if(params && params.fileMd5Value && params.fileMd5Value == this.fileMd5Value){
      flag = true
    }
    if(params && params.fileMd5Value && params.fileMd5Value != this.fileMd5Value){
      flag = false
    }
    return flag
  }

  /**
   * 单文件上传
   * @param {*} file // 文件对象
   * @param {*} params // 上传参数对象
   */
  async formUploadStart(file, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        if(file && file.raw){
          file = file.raw
        }

        if(!(file instanceof File)){
          throw Error('参数错误')
        }

        this.file = file
        this.params = params
        this.fileSize = file.size
        break;
    }

    this.type = 'formUploadStart'

    that.this_start = true
    let formData = new FormData();

    formData.append('file', file);

    formData.append('params', JSON.stringify(this.params))

    this.$axios.post(that.path + 'mediaUpload', formData, {
        onUploadProgress: function (e) {
          if (e.lengthComputable) {
            let arr_percentage = (e.loaded / e.total) * 100;
            if (that.events['upload_progress']) {
              that.events['upload_progress']({radio: arr_percentage})
            }
          }
        }
      })
      .then((response) => {
        if(response && response.data && response.data.data && response.data.data.media_id){
          that.media_id = response.data.data.media_id
        }
        if (that.events['callback']) {
          that.events['callback'](response.data)
        }
        that.this_start = false
      })
      .catch((err) => {
        console.log(err)
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](response.data)
        }
      })
  }

  /**
   * 图片序列上传
   * @param {*} file // 文件对象
   * @param {*} params // 上传参数对象
   */
  async imageSequenceUpload(file_list, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        this.file = file_list
        this.params = params
        // this.fileSize = file.size
        break;
    }

    this.type = 'imageSequenceUpload'

    that.this_start = true
    let formData = new FormData();

    for(let index in file_list){
      if(file_list[index].raw){
        formData.append('file',file_list[index].raw);
      } else {
        formData.append('file',file_list[index]);
      }
    }

    formData.append('params', JSON.stringify(this.params))

    this.$axios.post(that.path + 'mediaUpload', formData, {
        onUploadProgress: function (e) {
          if (e.lengthComputable) {
            let arr_percentage = (e.loaded / e.total) * 100;
            if (that.events['upload_progress']) {
              that.events['upload_progress']({radio: arr_percentage})
            }
          }
        }
      })
      .then((response) => {
        if(response && response.data && response.data.list && response.data.list.id){
          that.media_id = response.data.list.id
        }
        that.this_start = false
        if (that.events['callback']) {
          that.events['callback'](response.data)
        }
      })
      .catch((err) => {
        console.log(err)
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](response.data)
        }
      })
  }

  /**
   * ai文件上传
   * @param {*} file_list // 文件对象数组
   * @param {*} params // 上传参数对象
   */
  async aiFileUpload(file_list, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        throw Error('参数错误')
        break;

      default:
        this.file = file_list
        this.params = params
        // this.fileSize = file.size
        break;
    }

    this.type = 'aiFileUpload'

    that.this_start = true
    let formData = new FormData();

    for(let index in file_list){
      if(file_list[index].raw){
        formData.append('file',file_list[index].raw);
      } else {
        formData.append('file',file_list[index]);
      }
    }

    let key = Object.keys(that.params)
    for(let key_value of key){
      if(that.params[key_value] && that.params[key_value] !== ''){
        formData.append(key_value, this.params[key_value])
      }
    }

    // formData.append('params', JSON.stringify(this.params))

    this.$axios.post(that.path + 'ai_upload', formData, {
        onUploadProgress: function (e) {
          if (e.lengthComputable) {
            let arr_percentage = (e.loaded / e.total) * 100;
            if (that.events['upload_progress']) {
              that.events['upload_progress']({radio: arr_percentage})
            }
          }
        }
      })
      .then((response) => {
        that.this_start = false
        if (that.events['callback']) {
          that.events['callback'](response.data)
        }
      })
      .catch((err) => {
        console.log(err)
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](response.data)
        }
      })
  }

  /**
   * 
   * @param {*} file
   * @param {*} action_name 
   * @param {*} params 
   */
  async customUpload(file, action_name, params) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:

      case 2:
        throw Error('参数错误')
        break;

      default:
        if(file && file.raw){
          file = file.raw
        }

        if(!(file instanceof File)){
          throw Error('参数错误')
        }

        this.file = file
        this.params = params
        this.action_name = action_name
        this.fileSize = file.size
        break;
    }

    this.type = 'customUpload'

    that.this_start = true
    let formData = new FormData();

    formData.append('file', file);
    formData.append('action_name', action_name)
    formData.append('params', JSON.stringify(this.params))

    this.$axios.post(that.path + 'custom_upload', formData, {
        onUploadProgress: function (e) {
          if (e.lengthComputable) {
            let arr_percentage = (e.loaded / e.total) * 100;
            if (that.events['upload_progress']) {
              that.events['upload_progress']({radio: arr_percentage})
            }
          }
        }
      })
      .then((response) => {
        if (that.events['callback']) {
          that.events['callback'](response.data)
        }
        that.this_start = false
      })
      .catch((err) => {
        console.log(err)
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](response.data)
        }
      })
  }

  /**
   * http下载入媒资
   * @param {*} http_params 
   * @param {*} params 
   */
  async httpDownload(http_params, params){
    this.type = 'httpDownload'
    let that = this
    this.params = params
    this.other_params = http_params
    http_params.params = params
    that.this_start = true
    this.$axios.post(that.path + 'saveMediaUrl', http_params)
      .then((response) => {
        if(response && response.data && response.data.data && response.data.data.id){
          that.media_id = response.data.data.id
        }
        console.log(response)
        if (that.events['callback']) {
          that.events['callback'](response.data)
        }
        that.this_start = false
      })
      .catch((err) => {
        console.log(err)
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](err)
        }
      })
  }

  /**
   * ftp下载入媒资
   * @param {*} ftp_params 
   * @param {*} params 
   */
  async ftpDownload(ftp_params, params){
    this.type = 'ftpDownload'
    let that = this
    this.params = params
    this.other_params = ftp_params
    let _params = {
      path: ftp_params.path,
      connect_params: {
        host: ftp_params.host,
        port: ftp_params.port,
        user: ftp_params.user,
        password: ftp_params.password
      },
      params: params
    }
    ftp_params.params = params
    that.this_start = true
    this.$axios.post(that.path + 'ftpDownloadMedia', _params)
      .then((response) => {
        if(response && response.data && response.data.data && response.data.data.id){
          that.media_id = response.data.data.id
        }
        console.log(response)
        if (that.events['callback']) {
          that.events['callback'](response.data)
        }
        that.this_start = false
      })
      .catch((err) => {
        console.log(err)
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](err)
        }
      })
  }

  /**
   * 分片上传大文件接口
   */
  async multipartUpload(file, params, callback) {
    let that = this;
    switch (arguments.length) {
      case 0:

      case 1:
        if (that.events['error']) {
          that.events['error']({
            msg: '参数错误'
          })
        }
        throw Error({
          msg: '参数错误'
        })
        break;

      default:
        if(file && file.raw){
          file = file.raw
        }

        if(!(file instanceof File)){
          if (that.events['error']) {
            that.events['error']({
              msg: '参数错误'
            })
          }
          throw Error({
            msg: '参数错误'
          })
        }

        this.file = file
        this.params = params
        this.fileSize = file.size
        break;
    }

    if(callback) {
      that.callback = callback
    }

    this.type = 'multipartUpload'

    that.this_start = true

    // 开始上传
    this.multipartUploadStart().catch(err => {
      if (that.events['error']) {
        that.events['error']({
          msg: '上传失败'
        })
      }
    })
  }

  /**
   * 分片上传方法
   */
  async multipartUploadStart() {
    if(!(this.file && this.params)){
      throw('参数错误')
    }
    let that = this
    // 第一步：按照 修改时间+文件名称+最后修改时间-->MD5
    // 开始校验
    if (!this.fileMd5Value) {
      this.fileMd5Value = await this.md5File(this.file)
    } else {
      this.fileMd5Value = this.fileMd5Value.split('-')[0]
    }

    // 第二步：校验文件的MD5
    let result = await this.checkFileMD5(this.file.name, this.fileMd5Value)
    // 如果文件已存在, 就秒传
    if (!(result && result.ret && result.ret.code === 0)) {
      throw result
      return
    }

    console.log(result,'-result')

    // return

    // 第三步：检查并上传MD5
    try {
      let sleep = null
      if(result.upload_plan && result.upload_plan.rate_limit){
        if(result.upload_plan.chunk_size) {
          this.chunkSize = parseInt(result.upload_plan.chunk_size)
        }
        switch (result.upload_plan.rate_limit_unit) {
          case 'm':
            upload_limit = parseInt(result.upload_plan.rate_limit);
            sleep = this.chunkSize / (parseInt(result.upload_plan.rate_limit) * 1024)
            break;
          default:
            upload_limit = parseInt(result.upload_plan.rate_limit) / 1024;
            sleep = this.chunkSize / parseInt(result.upload_plan.rate_limit)
            break;
        }
      }
      this.fileMd5Value = result.fileMd5Value
      this.file.fileMd5Value = this.fileMd5Value
      console.log(this.fileMd5Value ,'--------this.fileMd5Value')
      // return
      await this.checkAndUploadChunk(this.fileMd5Value, result.fileList, sleep)
    } catch (err) {
      // if (that.events['error']) {
      //   that.events['error'](err)
      // }
      throw err
    }

    let _params = {}

    if(!this.params){
      this.params = {}
    }
    let key = Object.keys(this.params)

    for (let key_value of key) {
      if (this.params[key_value] && this.params[key_value] !== '') {
        _params[key_value] = this.params[key_value]
      }
    }

    this.is_upload_start = false

    if(!this.this_start){
      return
    }

    this.$axios.post(that.path + 'fileToolMergeFile', {
        file_name: this.file.name,
        params: _params,
        fileMd5Value: this.fileMd5Value
      }).then((response) => {
        if(response && response.data && response.data && response.data.media_id){
          that.media_id = response.data.media_id
        } else {
          that.this_start = false
          if (that.events['error']) {
            that.events['error'](response.data)
          }
        }
      }).catch((err) => {
        that.this_start = false
        if (that.events['error']) {
          that.events['error'](err)
        }
      })
  }

  /**
   * 获取文件的md5
   */
  md5File(file) {
    let that = this
    return new Promise((resolve, reject) => {
      let blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
        //chunkSize = 2097152, // Read in chunks of 2MB
        chunks = 2,
        // chunkSize = file.size / chunks,

        // chunkSize = file.size / 100,
        //chunks = Math.ceil(file.size / chunkSize),
        // chunks = 100,
        currentChunk = 0,
        spark = new SparkMD5(),
        fileReader = new FileReader();

      fileReader.onload = function (e) {
        // console.log('read chunk nr', currentChunk + 1, 'of', chunks);
        let str = crc32.buf(new ArrayBuffer(e.target.result)).toString(32)
        spark.append(str); // Append array buffer
        currentChunk++;

        if (currentChunk < chunks) {
          loadNext();
        } else {
          let cur = +(new Date())
          spark.append(file.name + file.lastModified + file.size)
          let result = spark.end()
          if (that.events['md5_progress']) {
            that.events['md5_progress']({progress: 100, file_md5: result})
          }
          resolve(result)
        }
      };
      // d50fcf3d6532a38a68863d9a2e2d6b56

      fileReader.onerror = function (err) {
        // console.warn('读取文件失败！');
        if (that.events['error']) {
          that.events['error']('读取文件失败！')
          console.warn('读取文件失败！');
        } else {
          alert('读取文件失败！')
        }
      };

      function loadNext() {
        // var start = currentChunk * chunkSize,
        //   end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize;
        console.log('loadNext')
        let start = 0
        let end = 0 
        let _chunkSize = 2 * 1024 * 1024

        switch (currentChunk) {
          case 0:
            start = 0
            end = file.size > _chunkSize ? _chunkSize : file.size
            fileReader.readAsArrayBuffer(blobSlice.call(file, 0, 2 * 1024 * 1024));
            break;

          case 1:
            start = file.size < _chunkSize ? 0 : (file.size - _chunkSize)
            end = file.size
            fileReader.readAsArrayBuffer(blobSlice.call(file, start, 2 * 1024 * 1024));
            break;
        
          default:
            break;
        }

        // fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
        // if (that.events['md5_progress']) {
        //   that.events['md5_progress']({progress: parseInt((currentChunk + 1)/chunks * 100) })
        // }
      }
      loadNext();
    })
  }

  /**
   * 校验文件的MD5
   */
  checkFileMD5(fileName, fileMd5Value) {
    return new Promise((resolve, reject) => {

      this.$axios.post(this.path + 'fileToolCheckFile', {
        fileMd5Value: fileMd5Value
      }).then((response) => {
        if (response && response.data) {
          resolve(response.data)
        } else {
          reject('error')
        }
      }).catch((err) => {
        console.log(err)
        reject(err)
      })
    })
  }

  /**
   * 上传chunk
   */
  async checkAndUploadChunk(fileMd5Value, chunkList) {
    let that = this
    let chunks = 0;
    chunks = Math.ceil(this.fileSize / this.chunkSize)
    let hasUploaded = chunkList.length
    if (chunks === chunkList.length - 1) {
      if (that.events['upload_progress']) {
        that.events['upload_progress']({radio: 100})
      }
    }
    let radio = Math.floor((hasUploaded / chunks) * 100)
    if (that.events['upload_progress']) {
      that.events['upload_progress']({radio: radio})
    }
    this.is_upload_start = true
    // await this.$axios.get('/getServiceHost').then(response => {
    //   if(response && response.data){
    //     that.serviceHost = response.data.split(',')
    //   }
    // }).catch(err => {
    //   console.log(err,'---->>>>> getServiceHost err')
    // })
    if(that.events['start']){
      that.events['start']({fileMd5Value: fileMd5Value})
    }
    upload_num = upload_num + 1;
    for (let i = 0; i < chunks; i++) {
      let exit = chunkList.indexOf(i + "") > -1
      // 如果已经存在, 则不用再上传当前块
      if (!exit) {
        if(!this.is_upload_start){ 
          this.this_start = false
          // if(that.events['pause']){
          //   that.events['pause']({fileMd5Value: fileMd5Value})
          // }
          // 如果数量已经为0，就重置为0
          upload_num = upload_num ?  (upload_num - 1) : 0;
          return 
        }
        let start_time = new Date().getTime()
        try {
          let index = await this.upload(i, fileMd5Value, chunks)
        } catch (err) {
          this.is_upload_start = false
          this.this_start = false
          if(that.events['pause']){
            that.events['pause']({fileMd5Value: fileMd5Value})
          }  
          if (that.events['error']) {
            that.events['error'](err)
          }
          // 如果数量已经为0，就重置为0
          upload_num = upload_num ?  (upload_num - 1) : 0;
          return
        }
        let end_time = new Date().getTime()

        hasUploaded++
        radio = Math.floor((hasUploaded / chunks) * 100)

        if (that.events['upload_progress']) {
          that.events['upload_progress']({radio: radio})
        }

        let sleep = 0
        if(upload_limit) {
          sleep = this.get_upload_sleep(this.chunkSize)
        }
        console.log(sleep, '----------sleep')
        console.log(upload_num, '----------upload_num')

        if(sleep){
          let sleep_time = sleep - ( end_time - start_time )
          if(sleep_time > 0){
            await this.sleep(sleep_time)
          }
        }
      }
    }
    if (that.events['upload_progress']) {
      that.events['upload_progress']({radio: 100, over: true})
    }
    // 如果数量已经为0，就重置为0
    upload_num = upload_num ?  (upload_num - 1) : 0;
  }

  /**
   * 上传chunk
   */
  upload(i, fileMd5Value, chunks) {
    let that = this
    return new Promise((resolve, reject) => {
      that.socketUpdateToken()

      //构造一个表单，FormData是HTML5新增的
      let end = (i + 1) * that.chunkSize >= that.file.size ? that.file.size : (i + 1) * that.chunkSize
      let form = new FormData()
      form.append("file", that.file.slice(i * that.chunkSize, end)) //file对象的slice方法用于切出文件的一部分
      // form.append("total", chunks) //总片数
      form.append("index", i) //当前是第几片     
      form.append("fileMd5Value", fileMd5Value)

      that.prev_progress = null

      let n = 0

      let config = {
        timeout: 10 * 60 * 1000
      }
      if(this.serviceHost && this.serviceHost.length > 0){
        var intdata = parseInt(Math.random()*(this.serviceHost.length),10);
        config.baseURL = this.serviceHost[intdata];
      }
      console.log(form, 'form')
      that.$axios.post(that.path + 'max_upload',form, config)
      .then((response) => {
        if(response.data.ret.code === 0) {
          resolve(response.data.desc)
        } else {
          reject(response.data)
        }
      })
      .catch((err) => {
        console.log(err,'------err')
        reject(err)
      })
    })
  }

  async sleep(time) {
    return new Promise(async (resolve, reject) => {
      try {
        setTimeout(function() {
          resolve(true)
        }, time)
      } catch (e) {
        resolve(true)
      }
    })
  }

  socket_media_update_callback(res){
    let that = this
    if(res && res.id == that.media_id){
      that.socketUpdateToken()
      if (that.events['media_prepro_callback']) {
        that.events['media_prepro_callback'](res)
      }
    }
  }

  socket_merge_file_over(res){
    let that = this
    if(res && res.fileMd5Value === that.fileMd5Value){
      that.socketUpdateToken()
      if(res && res.ret && res.ret.code === 0){
        if(res.progress) {
          try {
            if (that.events['merge_progress']) {
              that.events['merge_progress']({progress: parseInt((res.progress.index / res.progress.all) * 100)})
            }
            // that.mergeProgress = parseInt((res.progress.index / res.progress.all) * 100)
          } catch (err) {
            console.log(err)
          }
        } else {
          this.is_upload_start = false
          this.this_start = false
          if (that.events['callback']) {
            that.events['callback'](res)
          }
        }
      } else {
        this.is_upload_start = false
        this.this_start = false
        if (that.events['error']) {
          that.events['error'](res)
        }
      }
    }
  }

  socket_media_prepro_ratio_callback(res) {
    let that = this
    console.log(res , res.id , that.media_id, 'prodfsfa')
    if(res && res.id == that.media_id){
      that.socketUpdateToken()
      console.log(that.events['media_prepro_ratio'], '======prepro')
      if (that.events['media_prepro_ratio']) {
        that.events['media_prepro_ratio'](res)
      }
    }
  }

  socket_media_http_progress(res){
    let that = this
    if(res && res.id == that.media_id){
      that.socketUpdateToken()
      if (that.events['media_http_progress']) {
        that.events['media_http_progress'](res)
      }
    }
  }

  socket_media_ftp_progress(res){
    let that = this
    if(res && res.id == that.media_id){
      that.socketUpdateToken()
      if (that.events['media_ftp_progress']) {
        that.events['media_ftp_progress'](res)
      }
    }
  }

  get_upload_sleep(chunkSize) {
    return (chunkSize * upload_num / (parseInt(upload_limit) * 1024))
  }

  /**
   * 回调看是否更新token
   */
  socketUpdateToken() {
    if (!window.$config.checkToken) {
      return;
    }
    let that = this
      window.checkToken ()
    if (top.location != self.location) {
      window.parent.postMessage(
        // 子传父
        {
          type: 'updateToken',
          origin: 'mediaUpload'
        },
        '*'
      );
    }else {
      window.checkToken ()
    }
    that.token = sessionStorage.getItem('token')

    if(that.callback) {
      that.callback(that.token)
    }
  }
}

export default MediaUpload;
