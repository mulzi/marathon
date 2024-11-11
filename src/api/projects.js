import {$axio} from './index'
// 获取活动列表
const GetProjectsList = (data, mediaPath) => {
  return $axio({
    url: '/listActivity',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}
// 创建活动
const CreateProject = (data, mediaPath) => {
  return $axio({
    url: '/createActivity',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 更新活动
const UpdateProject = (data, mediaPath) => {
  return $axio({
    url: '/updateActivity',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 删除活动
const DeleteProject = (data, mediaPath) => {
  return $axio({
    url: `/deleteActivity`,
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 获取媒资支持类型
const MediaFileType = (mediaPath) => {
  return $axio({
    url: `/return_suffix_name`,
    method: 'get',
    baseURL: mediaPath,
  })
}

// 获取活动下媒资列表
const MediaList = (data, mediaPath) => {
  return $axio({
    url: `/getActivityMediaList`,
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 获取活动下抽取的成品列表
const ProductList = (data, mediaPath) => {
  return $axio({
    url: '/listSmartVideo',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 删除活动下媒资
const DeleteMedia = (data, mediaPath) => {
  return $axio({
    url: `/deleteActivityMedia`,
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 更新活动下媒资名称
const RenameMedia = (data, mediaPath) => {
  return $axio({
    url: `/updateMediaCatalogingInfo`,
    method: 'post',
    baseURL: mediaPath,
    data
  })
}
const AIOrcMedia = (data, mediaPath) => {
  return $axio({
    url: `/start_init_media_title_ocrtitle`,
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 获取微信信息和签名
const getDspWeixinInfo = (data, mediaPath) => {
  return $axio({
    url: `/getDspWeixinInfo`,
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 根据返回的媒资id，调取入库api
const createSmartVideo = (data, mediaPath) => {
  return $axio({
    url: '/createSmartVideo',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 删除成品
const deleteSmartVideo = (data, mediaPath) => {
  return $axio({
    url: '/deleteSmartVideo',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 重新下发根据人脸抽取视频任务
const startSmartTrackTask = (data, mediaPath) => {
  return $axio({
    url: '/startSmartTrackTask',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 智能拆条创建ai素材频道接口
const createAiActivityChannels = (data, mediaPath) => {
  return $axio({
    url: '/createAiActivityChannels',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 获取活动绑定的用户
/**
 * 
 * @param {*} activity_id  Number
 * @returns 
 */
const listActivityUserRight = (data, mediaPath) => {
  return $axio({
    url: '/listActivityUserRight',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

// 更新活动绑定的用户
/**
 * 
 * @param {*} activity_id  Number
 * @param {*} user_ids Array  
 * @returns 
 */
const updateActivityUserRight = (data, mediaPath) => {
  return $axio({
    url: '/updateActivityUserRight',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}
/**
 * 
 */
const channelMediaOrder = (data, mediaPath) => {
  return $axio({
    url: '/channelMediaOrder',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

/**
 * 复制活动
 */
const CopyActivity = (data, mediaPath) => {
  return $axio({
    url: '/CopyActivity',
    method: 'post',
    baseURL: mediaPath,
    data
  })
}

export {
  GetProjectsList,
  CreateProject,
  UpdateProject,
  DeleteProject,
  MediaList,
  ProductList,
  DeleteMedia,
  RenameMedia,
  MediaFileType,
  getDspWeixinInfo,
  createSmartVideo,
  deleteSmartVideo,
  startSmartTrackTask,
  AIOrcMedia,
  createAiActivityChannels,
  listActivityUserRight,
  updateActivityUserRight,
  channelMediaOrder,
  CopyActivity
}