/**
 * 题库校验：检查字段完整性、答案合法性、题型正确性与 id 唯一性。
 * 用法：npm run check:bank
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadModule(file, name) {
  const src = fs.readFileSync(path.join(root, file), 'utf8')
  const marker = 'export const ' + name + ' = '
  const start = src.indexOf(marker)
  if (start < 0) throw new Error('未能在 ' + file + ' 中找到 ' + name)
  const from = start + marker.length
  const end = src.indexOf('\nexport default', from)
  if (end < 0) throw new Error('未能在 ' + file + ' 中找到 export default')
  const json = src.slice(from, end).trim()
  return JSON.parse(json)
}

let questions, subjects
try {
  questions = loadModule('src/data/questions.js', 'questions')
  subjects = loadModule('src/data/meta.js', 'subjects')
} catch (e) {
  console.error('读取题库失败:', e.message)
  process.exit(1)
}

console.log('题目总数:', questions.length)
console.log('科目数:', subjects.length)

const errors = []
const typeCount = {}
const subjectCount = {}
const subjectKeys = new Set(subjects.map(s => s.key))
const chapterKeys = new Set()
subjects.forEach(s => (s.chapters || []).forEach(ch => chapterKeys.add(s.key + '|' + ch.id)))

questions.forEach(q => {
  for (const k of ['id', 'subject', 'chapter', 'type', 'stem', 'answer', 'explain']) {
    if (q[k] === undefined || q[k] === null || q[k] === '') {
      errors.push(`${q.id || '?'} 缺少字段 ${k}`)
      return
    }
  }
  typeCount[q.type] = (typeCount[q.type] || 0) + 1
  subjectCount[q.subject] = (subjectCount[q.subject] || 0) + 1

  if (!subjectKeys.has(q.subject)) errors.push(`${q.id} 的科目 key 不存在: ${q.subject}`)
  if (!chapterKeys.has(q.subject + '|' + q.chapter)) errors.push(`${q.id} 的章节不存在: ${q.chapter}`)

  const ans = String(q.answer)
  if (q.type === 'judge') {
    if (!['正确', '错误'].includes(ans)) errors.push(`${q.id} 判断题答案应为「正确」或「错误」，实际 ${ans}`)
  } else {
    const letters = new Set(ans.match(/[A-H]/g) || [])
    if (!letters.size) errors.push(`${q.id} 选择题答案异常: ${ans}`)
    const opts = new Set((q.options || []).map(o => o.letter))
    if (![...letters].every(l => opts.has(l))) errors.push(`${q.id} 答案 ${ans} 不在选项中`)
    if (q.type === 'single' && letters.size !== 1) errors.push(`${q.id} 单选题答案不是唯一: ${ans}`)
    if (q.type === 'multi' && letters.size < 2) errors.push(`${q.id} 多选题答案不足 2 项: ${ans}`)
  }

  for (const pat of [/答案\s*[:：]/, /正确答案/, /应选\s*[A-H]/]) {
    if (pat.test(q.stem)) {
      errors.push(`${q.id} 题干疑似残留答案痕迹: ${pat}`)
      break
    }
  }
})

console.log('题型分布:', typeCount)
console.log('科目分布:', subjectCount)

const ids = questions.map(q => q.id)
if (new Set(ids).size !== ids.length) errors.push('题目 id 存在重复')

if (errors.length) {
  console.error(`\n发现 ${errors.length} 个问题：`)
  errors.slice(0, 40).forEach(e => console.error('  -', e))
  process.exit(1)
}
console.log('\n校验通过：字段完整、答案合法、题型正确、无答案痕迹、id 唯一')
