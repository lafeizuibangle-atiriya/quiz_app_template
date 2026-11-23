/**
 * 本地存储层：错题本 / 收藏 / 练习进度 / 考试记录。
 * 统一走 uni.getStorageSync，App / H5 / 小程序 通用。
 * 键名前缀来自 config.js，换项目时不会和旧数据冲突。
 */
import config from '../config.js'

const P = config.storagePrefix
const K_WRONG = P + 'wrong_v1'      // 错题本 { qid: {count, last} }
const K_FAV = P + 'fav_v1'          // 收藏   { qid: timestamp }
const K_PROG = P + 'prog_v1'        // 进度   { qid: {right, total, last} }
const K_EXAM = P + 'exam_v1'        // 考试记录 [ {subject, ts, score, total, right, wrong} ]
const K_FLAG = P + 'inited_v1'
export const K_LAST_SETUP = P + 'last_setup'

function read(key, dft) {
  try {
    const v = uni.getStorageSync(key)
    if (v === '' || v === null || v === undefined) return dft
    return typeof v === 'string' ? JSON.parse(v) : v
  } catch (e) {
    return dft
  }
}

function write(key, val) {
  try {
    uni.setStorageSync(key, JSON.stringify(val))
  } catch (e) {
    // 存储写入失败（超限等），忽略即可，不影响当前答题
  }
}

export function ensureStoreInit() {
  try {
    if (!uni.getStorageSync(K_FLAG)) {
      write(K_WRONG, {})
      write(K_FAV, {})
      write(K_PROG, {})
      write(K_EXAM, [])
      uni.setStorageSync(K_FLAG, '1')
    }
  } catch (e) {
    // 忽略
  }
}

/* ---------- 错题本 ---------- */
export function getWrongbook() {
  return read(K_WRONG, {})
}

export function addWrong(qid) {
  const wb = getWrongbook()
  const it = wb[qid] || { count: 0, last: 0 }
  it.count += 1
  it.last = Date.now()
  wb[qid] = it
  write(K_WRONG, wb)
}

export function removeWrong(qid) {
  const wb = getWrongbook()
  if (wb[qid]) {
    delete wb[qid]
    write(K_WRONG, wb)
  }
}

export function clearWrongbook() {
  write(K_WRONG, {})
}

export function wrongCount() {
  return Object.keys(getWrongbook()).length
}

/* ---------- 收藏 ---------- */
export function getFavorites() {
  return read(K_FAV, {})
}

export function isFav(qid) {
  return !!getFavorites()[qid]
}

export function toggleFav(qid) {
  const fav = getFavorites()
  if (fav[qid]) {
    delete fav[qid]
  } else {
    fav[qid] = Date.now()
  }
  write(K_FAV, fav)
  return !!fav[qid]
}

export function favCount() {
  return Object.keys(getFavorites()).length
}

/* ---------- 练习进度（每题一次统计） ---------- */
export function getProgress() {
  return read(K_PROG, {})
}

export function recordAnswer(qid, isRight) {
  const pr = getProgress()
  const it = pr[qid] || { right: 0, total: 0, last: 0 }
  it.total += 1
  if (isRight) {
    it.right += 1
    // 答对即从错题本移除
    removeWrong(qid)
  } else {
    addWrong(qid)
  }
  it.last = Date.now()
  pr[qid] = it
  write(K_PROG, pr)
}

/* ---------- 考试记录 ---------- */
export function getExamRecords() {
  return read(K_EXAM, [])
}

export function addExamRecord(rec) {
  const list = getExamRecords()
  list.unshift(rec)
  write(K_EXAM, list.slice(0, 30))
}

/* ---------- 汇总统计 ---------- */
export function summarize(questions) {
  const pr = getProgress()
  let done = 0
  let right = 0
  for (let i = 0; i < questions.length; i++) {
    const it = pr[questions[i].id]
    if (it && it.total > 0) {
      done += 1
      if (it.right > 0) right += 1
    }
  }
  return {
    total: questions.length,
    done: done,
    right: right,
    wrong: done - right,
    rate: done ? Math.round((right / done) * 100) : 0
  }
}

/* ---------- 数据管理 ---------- */
export function resetAll() {
  write(K_WRONG, {})
  write(K_FAV, {})
  write(K_PROG, {})
  write(K_EXAM, [])
}

/** 导出全部学习数据，便于备份或迁移 */
export function exportData() {
  return {
    version: 1,
    exportedAt: Date.now(),
    wrong: getWrongbook(),
    fav: getFavorites(),
    progress: getProgress(),
    exams: getExamRecords()
  }
}

/** 导入学习数据，字段缺失时按空数据处理 */
export function importData(data) {
  if (!data || typeof data !== 'object') return false
  write(K_WRONG, data.wrong || {})
  write(K_FAV, data.fav || {})
  write(K_PROG, data.progress || {})
  write(K_EXAM, data.exams || [])
  return true
}
