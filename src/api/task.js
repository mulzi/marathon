import {$axio} from './index'
// 下发人脸智能检测任务
const TaskSearchFaceTask = (params) => {
  return $axio.post(`/task/searchFaceTask`, params)
}
// 查询人脸智能检测任务
const TaskListFaceTask = (params) => {
  return $axio.post(`/task/listFaceTask`, params)
}
// 删除人脸智能检测任务
const TaskDeleteFaceTask = (params) => {
  return $axio.post(`/task/deleteFaceTask`, params)
}
// 字幕生成图片，存在媒资里
const TaskSubtitleCreate = (params) => {
  return $axio.post(`/task/subtitleCreate`, params)
}
// 上传base64格式到媒资
const TaskBase64ToMedia = (params) => {
  return $axio.post(`/task/saveBase64Image`, {do_copy: true, params})
}
// 下发编辑任务
const TaskEditYedit = (params) => {
  return $axio.post(`/task/edit_yedit`, params)
}
// 批量下发编辑任务
const TaskEditYeditBatch = (params) => {
  return $axio.post(`/task/edit_yedit_batch`, params)
}
// 删除任务
const TaskDelete = (params) => {
  return $axio.delete(`/task/delete`, params)
}
// 取消任务
const TaskAbolishYedit = (params) => {
  return $axio.post(`/task/abolish_yedit`, params)
}
// 任务列表
const TaskGetList = (params) => {
  return $axio.post(`/task/list`, params)
}
// basTv AMS手动上传
const TaskExternalReq = (params) => {
  return $axio.post(`/task/external_req`, params)
}
// 任务重新下发
const TaskResetSendTask = (params, typePage) => {
  return $axio.post(`/task/${typePage}/reset_send_task`, params)
}
// 获取频道源分辨率
const TaskChannelWh = (params) => {
  return $axio.post(`/task/getChannelWh`, params)
}
// 下发拆条任务
const TaskYedit = (params) => {
  return $axio.post(`/task/yedit`, params)
}
// 批量下发拆条任务
const TaskYeditBatch = (params) => {
  return $axio.post(`/task/yeditBatch`, params)
}
// besTv 云拆条获取AI分析信息
const TaskStripAiCallback = (params) => {
  return $axio.post(`/task/strip/get_ai_call_backs`, params)
}
// ws person_ws 云拆条获取AI分析信息
const TaskStripWsAiCallback = (params) => {
  return $axio.post(`/task/strip/get_ws_ai`, params)
}
// 获取AI人脸识别数据
const TaskStripWsAiFace = (params) => {
  return $axio.post(`/task/get_ws_aiface`, params)
}

export {
  TaskSearchFaceTask,
  TaskListFaceTask,
  TaskDeleteFaceTask,
  TaskSubtitleCreate,
  TaskBase64ToMedia,
  TaskEditYedit,
  TaskEditYeditBatch,
  TaskDelete,
  TaskAbolishYedit,
  TaskGetList,
  TaskExternalReq,
  TaskResetSendTask,
  TaskChannelWh,
  TaskYedit,
  TaskYeditBatch,
  TaskStripAiCallback,
  TaskStripWsAiCallback,
  TaskStripWsAiFace,
}