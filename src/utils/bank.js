/**
 * 题库索引层：把题目数组建成按科目/章节的索引，提供组卷与答案判定工具。
 * 题库数据在 data/ 目录，题型名称在 config.js，这里不写任何具体题目内容。
 */
import config from '../config.js'
import { questions } from '../data/questions.js'
import { subjects } from '../data/meta.js'

export const ALL_QUESTIONS = questions
export const SUBJECTS = subjects
export const TYPE_LABEL = config.typeLabels

/* ---------- 索引 ---------- */
const byId = {}
const bySubject = {}
const byChapter = {}   // 章节 id 可能跨科目重复，索引键用 subject|chapter

for (let i = 0; i < questions.length; i++) {
  const q = questions[i]
  byId[q.id] = q
  ;(bySubject[q.subject] = bySubject[q.subject] || []).push(q)
  const ck = q.subject + '|' + q.chapter
  ;(byChapter[ck] = byChapter[ck] || []).push(q)
}

export function getQuestion(id) {
  return byId[id] || null
}

export function getSubject(key) {
  return subjects.find(s => s.key === key) || null
}

export function questionsOfSubject(key) {
  return bySubject[key] || []
}

/** 取某章的题目。chapterId 可能跨科目重复，需带上 subjectKey。 */
export function questionsOfChapter(chapterId, subjectKey) {
  if (subjectKey) return byChapter[subjectKey + '|' + chapterId] || []
  const out = []
  Object.keys(byChapter).forEach(k => {
    if (k.split('|')[1] === chapterId) out.push(...byChapter[k])
  })
  return out
}

export function chapterOf(subjectKey, chapterId) {
  const s = getSubject(subjectKey)
  if (!s) return null
  return (s.chapters || []).find(ch => ch.id === chapterId) || null
}

/* ---------- 答案处理 ---------- */
/** 答案字符串转集合；判断题答案为「正确/错误」整串 */
export function answerSet(q) {
  if (!q || !q.answer) return null
  if (q.type === 'judge') return new Set([q.answer])
  const s = new Set()
  for (const ch of q.answer) {
    if (ch >= 'A' && ch <= 'H') s.add(ch)
  }
  return s
}

/** 判定作答是否正确；picked 为字母数组（判断题传 ['正确'] 或 ['错误']） */
export function isCorrect(q, picked) {
  const a = answerSet(q)
  if (!a) return null
  if (a.size !== picked.length) return false
  return picked.every(x => a.has(x))
}

/** 选项列表（判断题动态生成） */
export function optionsOf(q) {
  if (q.type === 'judge') {
    return [
      { letter: '正确', text: '正确' },
      { letter: '错误', text: '错误' }
    ]
  }
  return q.options || []
}

/* ---------- 洗牌 / 组卷 ---------- */
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sample(arr, n) {
  const s = shuffle(arr)
  return n && n < s.length ? s.slice(0, n) : s
}

/**
 * 按章节权重抽题组卷（权重形如 "20%"）。
 * 某章题量不足时，从本科目剩余题目中补足到目标题量。
 */
export function buildExamPaper(subjectKey, count) {
  const subject = getSubject(subjectKey)
  if (!subject) return []
  const total = count || subject.examCount || 10

  const weighted = (subject.chapters || []).map(ch => {
    const w = parseFloat(String(ch.weight).replace('%', '')) || 0
    return { ch, w }
  })
  const sumW = weighted.reduce((s, x) => s + x.w, 0) || 1

  let assigned = 0
  const picked = []
  weighted.forEach((x, idx) => {
    const pool = questionsOfChapter(x.ch.id, subjectKey)
    let quota
    if (idx === weighted.length - 1) {
      quota = total - assigned
    } else {
      quota = Math.round((x.w / sumW) * total)
    }
    quota = Math.max(0, Math.min(quota, pool.length))
    assigned += quota
    picked.push({ pool, quota })
  })

  const paper = []
  picked.forEach(p => {
    paper.push(...sample(p.pool, p.quota))
  })

  if (paper.length < total) {
    const used = new Set(paper.map(q => q.id))
    const rest = questionsOfSubject(subjectKey).filter(q => !used.has(q.id))
    paper.push(...sample(rest, total - paper.length))
  }

  return paper.slice(0, total)
}

/** 题库自检：返回问题描述数组，空数组表示题库格式正确 */
export function validateBank() {
  const problems = []
  const ids = new Set()
  questions.forEach((q, i) => {
    const at = '第 ' + (i + 1) + ' 题（' + (q.id || '无 id') + '）'
    if (!q.id) problems.push(at + '：缺少 id')
    else if (ids.has(q.id)) problems.push(at + '：id 重复')
    ids.add(q.id)
    if (!getSubject(q.subject)) problems.push(at + '：科目 key 不存在')
    else if (!chapterOf(q.subject, q.chapter)) problems.push(at + '：章节 id 不存在')
    if (!q.stem) problems.push(at + '：题干为空')
    if (!TYPE_LABEL[q.type]) problems.push(at + '：未知题型 ' + q.type)
    if (!q.answer) problems.push(at + '：缺少答案')
  })
  ;(subjects || []).forEach(s => {
    if (!s.key || !s.name) problems.push('科目配置缺少 key 或 name')
  })
  return problems
}

export { questions, subjects }
