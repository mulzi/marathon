const user = 'ws' // besTv 、  cscm 、 ws、  cscm_2, personal_ws

let default_config = {
  version: 'v1.0.2',
  // BaseUrl
  configUrl: {
    /**
     * ws等版本配置
     * editorBaseurl   云拆编请求配置 /api/cloudEditor/api/v1
     * editorSocket    云拆编socket-path  /api/cloudEditor
     * portalBaseUrl   登录以及修改密码等用户请求配置 /portal/api/v1
     * mediaBaseUrl    媒资上传等请求配置 /api/v1/media
     * mediaSocket     媒资socket-path /api/v1/media
     * mediaPath       媒资接口path   /api/v1/media/api/v1/media
     * 
     * 云转播
     * 
     * editorBaseurl   云拆编请求配置 /cloudv/editor
     * editorSocket    云拆编socket-path  /cloudv/editor
     * portalBaseUrl   登录以及修改密码等用户请求配置 /cloudv/portal
     * mediaBaseUrl    媒资上传等请求配置 /cloudv/media
     * mediaSocket     媒资socket-path /cloudv/media
     * mediaPath       媒资接口path   /cloudv/media
     * 
     */
    // editorBaseUrl: `/cloudv/editor`,
    // editorSocket: `/cloudv/editor`,
    // portalBaseUrl: `/cloudv/portal`,
    // mediaBaseUrl: `/cloudv/media`,
    // mediaSocket: `/cloudv/media`,
    // mediaPath: `/cloudv/media`
    editorBaseUrl: `/api/cloudEditor/api/v1`,
    editorSocket: `/api/cloudEditor`,
    portalBaseUrl: `/portal/api/v1`,
    mediaBaseUrl: `/api/v1/media`,
    mediaSocket: `/api/v1/media`,
    mediaPath: `/api/v1/media/api/v1/media`
  },
  // 页面title
  stripTitle: '云拆条',
  editTitle: '云快编',
  // 登录页，对接第三方时，需要配置
  // loginUrl: 'https://euvptest.icbtlive.com/yzblive/index.html',
  // 第三方对接时，不需要检查并更新token
  checkToken: false,
  User: user,
  EPG: {
    create_task: false, //epg导入时是否下发收录任务
  },
  pathwayType: ['text', 'pic', 'video', 'audio', 'imageSequence'], // 轨道需要显示多少个就配置多少个：['text', 'pic', 'video', 'audio', 'imageSequence'], imageSequence图片序列为了方便也暂时纳入到此项配置字段中
  tranType: false, //是否使用转码器类型 (_static, _dynamic)
  resolutionEdit: false, //是否可配置画布的比例
  webGL: false, //是否使用webgl模式下发参数
  extendEffect: ['filter', 'animation'], // 与webGL配置组合使用 ('filter', 'animation' 不支持 CPU)
  extendUnitLogo: ['Colorbar', 'logo'], // 与webGL配置组合使用 ('Colorbar', 'logo' 不支持 CPU)
  extendConfirm: ['type', 'category', 'genre', 'tag', 'flog', 
    'year_channel', 'language_channel', 'area_channel', 'director_channel',
    'actor_channel', 'film_mark', 'transcode_platform', 'level', 'group_public',
    'autoUpload', 'autoDelete', 'transcode', 'library_id', 'only_audio'
  ], // 提交公共隐藏信息
  stripExtendConfirm: ['agc_volume'], //strip提交信息隐藏 ()
  editExtendConfirm: ['merge', 'media_pro_check'],
  templateKeywords: {
    stripOutput: 'yzb_strip_output',
    editOutput: 'yzb_edit'
  },
  audioProject: false, // 是否启用音频项目 可以搭配 pathwayType 使用
  strip_time_limit: 120, // 刻度条时间，前后的限制长度,单位s
  strip_frame_audio: true, //是否启用拆条帧进退时播放声音
  media_upload_allow: false, // 是否允许媒资上传
  ai_upload_allow: false, //是否允许AI上传
  media_edit_allow: false, // 是否允许编辑素材
  media_delete_allow: false, // 是否允许删除素材
  media_filter_allow: false, //是否允许多样查询
  media_file_allow: false, // 媒资不显示文件夹
  media_product_allow: false, // 媒资是否显示成品
  media_source_api: true, //使用第三方api的媒资数据
  media_auto_delete: true, //媒资默认删除
  media_delete: 90, //媒资默认几天删除
  token_lose_time: 60*60,//token过期极限s
  tree_data_is_reqiured: false, //下发任务， 栏目是否必需
  is_dual: true, //是否启用双声道db
  aiConfig: false, //拆条ai接口
  stripRecode: false, //拆条分段录制
  outFileType: ['ts', 'mp4'], //定义输出
  is_auto_category: false, //频道是否自动分类
  time_click_depend_image: false, //拆条点击刻度时间，是否依赖刻度栏的预览图
  cutlist_dialog_on_slider: false, //控制切片列表是在控制栏展示还是展示区展示
  confirm_on_drag: true, //提交任务界面是否可拖动
  ai_type: 'ws', //拆条AI分类， ws besTv  personal_ws
  provider: {
    has_provider: false, // 任务提交界面是否显示提供商
    other_info_provider: '', //默认提供商
  },
  batch_release: false, //  是否支持批量发布
  user_message: false, //界面底部，展示用户，版本信息
  text_png: true, //字幕是否以图片形式下发
  faceRecognition: false, //人脸识别
  projectImportExport: false, // 云编辑项目导入导出功能
  priview_speed_linkage: false, // 预览的倍速和展示区倍速是否联动
  WXInfo: {
    // redirectUrl: `https://v.anystreaming.cn/api/v1/media/api/v1/media/getwechatcode`,
    redirectUrl: `/api/v1/media/getwechatcode`,
    debug: false
  },
  // 开启素材快编
  mediaEditor: false,
  // 配置高级设置的功能展示
  settingConfig: {
    video_attr: true, // 特征检测
    motion: true, // 动作识别
    text: true, // 文字识别
    speechRecognition: { // 语音识别
      enable: true,
      svr: 'http://192.168.2.108:10096'
    },
  },
  // 直播预览和录制模板名称定义
  liveTemplate: {
    preview: 'preview_720',
    record: 'record_8M',
  }
  
}

switch (user) {
  case 'ws':
    Object.assign(default_config, {
      outFileType: ['ts', 'mp4', 'flv', 'mov'],
    })
    break;
  case 'personal_ws':
    Object.assign(default_config, {
      outFileType: ['ts', 'mp4', 'flv', 'mov'],
      is_auto_category: true
    })
    break;
  case 'besTv':
    Object.assign(default_config, {
      
    })
    break;
  case 'cscm':
    Object.assign(default_config, {
      audioProject: false, // 是否启用音频项目 可以搭配 pathwayType 使用
      strip_frame_audio: false, //是否启用拆条帧进退时播放声音
      media_auto_delete: false, //媒资默认删除
      tree_data_is_reqiured: true, //下发任务， 栏目是否必需
      aiConfig: false, //拆条ai接口
      stripRecode: false, //拆条分段录制
      outFileType: ['ts', 'mp4', 'flv', 'mov'],
    })
    break;
  case 'cscm_2':
    Object.assign(default_config, {
      audioProject: false, // 是否启用音频项目 可以搭配 pathwayType 使用
      strip_frame_audio: false, //是否启用拆条帧进退时播放声音
      media_auto_delete: false, //媒资默认删除
      aiConfig: false, //拆条ai接口
      stripRecode: false, //拆条分段录制
    })
    break;
  default:
    break;
}

window.$config = default_config;
