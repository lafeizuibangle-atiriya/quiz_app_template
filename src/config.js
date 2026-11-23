/**
 * 应用配置：换项目时只改这一个文件。
 * 题库数据和分类放在 src/data/，运行逻辑在 src/utils/。
 */

export default {
  // 应用名称（会显示在导航栏、manifest、README 对应位置需手动同步）
  appName: '刷题宝典',

  // 主题色：主色、主色浅底、成功色、错误色
  theme: {
    primary: '#2b6cb0',
    primaryLight: '#eaf2fb',
    success: '#2f855a',
    successLight: '#e8f6ee',
    danger: '#c53030',
    dangerLight: '#fdecec'
  },

  // 本地存储键前缀。改前缀等于换一套独立数据，不会和旧数据串在一起
  storagePrefix: 'quiz_tpl_',

  // 默认科目 key，对应 data/meta.js 里第一个科目的 key
  defaultSubject: 'computer',

  // 练习页题量选项，value 为 0 表示全部
  practiceSizes: [
    { value: 10, label: '10', desc: '快速' },
    { value: 20, label: '20', desc: '常规' },
    { value: 50, label: '50', desc: '加量' },
    { value: 0, label: '全部', desc: '清完' }
  ],

  // 默认题量
  defaultSize: 10,

  // 题型显示名，题库里 type 字段用这里的 key
  typeLabels: {
    judge: '判断题',
    single: '单选题',
    multi: '多选题'
  }
}
