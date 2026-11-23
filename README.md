# 通用刷题 App 模板

![uni-app](https://img.shields.io/badge/uni--app-Vue%203-4FC08D)
![Vue](https://img.shields.io/badge/Vue-3-35495e)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![License](https://img.shields.io/badge/license-MIT-blue)

基于 uni-app + Vue 3 的刷题应用模板。内置顺序练习、随机练习、背题、模拟考试、错题本、收藏和统计，题库与界面解耦，换一套题就能做成自己的刷题 App。可运行到 H5、Android、iOS 和小程序。

## 功能

**练习**
- 顺序练习：按题库顺序逐题作答
- 随机练习：本科目随机抽题
- 背题模式：直接显示答案与解析
- 章节多选、题量可选，作答后标出正确项与错误项

**模拟考试**
- 按章节权重随机组卷，可配置题量与时长
- 倒计时，最后 5 分钟变红，时间到自动交卷
- 答题卡抽屉，可跳题、查看作答情况
- 成绩单：得分、通过判定、各章节正确率、逐题回顾

**学习中心**
- 错题本：答错自动收录，答对自动移出
- 我的收藏：手动星标
- 专项练习：把错题或收藏整组再刷一遍
- 数据管理：清空错题本、重置全部学习数据

**统计**
- 已练题数、总正确率、题库覆盖率
- 分科目、分章节掌握度进度条
- 最近 30 次考试记录

## 快速开始

需要 Node.js 18 及以上。

```bash
npm install
npm run dev:h5      # H5 开发服务器
npm run build:h5    # 构建到 dist/build/h5
```

用 HBuilderX 打开工程目录，可以直接「运行到浏览器」或「运行到手机或模拟器」。命令行方式需要 HBuilderX 自带的 uni-app 编译环境，见下方注意事项。

校验题库格式：

```bash
npm run check:bank
```

## 换成自己的题库

这是模板最关键的一步。所有题目、科目、章节都在 `src/data/`，界面代码不需要改。

**第 1 步：准备源数据**

在 `data/source/banks.json` 里按下面的结构写题目（文件里已有一份 24 题的完整示例可以照抄）：

```json
{
  "subjects": [
    {
      "key": "computer",
      "name": "计算机基础",
      "full": "完整名称",
      "code": "DEMO-001",
      "total": 24,
      "examCount": 10,
      "examMinutes": 20,
      "chapters": [
        { "id": "s01", "name": "第一章", "weight": "35%", "focus": "说明", "count": 8 }
      ]
    }
  ],
  "questions": [
    {
      "id": "computer_s01_001",
      "subject": "computer",
      "chapter": "s01",
      "type": "judge",
      "stem": "题干",
      "answer": "正确",
      "explain": "解析"
    },
    {
      "id": "computer_s01_002",
      "subject": "computer",
      "chapter": "s01",
      "type": "single",
      "stem": "题干",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "answer": "A",
      "explain": "解析"
    }
  ]
}
```

字段说明：
- `type`：`judge`（判断题）、`single`（单选题）、`multi`（多选题）
- `answer`：判断题填 `正确` 或 `错误`；单选填 `B`；多选填 `ABD`
- 判断题不需要写 `options`，界面会自动生成「正确 / 错误」两项
- `weight`：模拟考试按章节抽题的权重，例如 `35%`
- `total`、`count` 只用于界面展示，实际题量从题库统计
- 每个科目的 `key` 要唯一，题目的 `subject` 必须能对应到某个科目

**第 2 步：导入**

```bash
python tools/import_questions.py data/source/banks.json
npm run check:bank
```

脚本会校验数据，然后生成 `src/data/questions.js` 和 `src/data/meta.js`。生成的文件不要手工编辑，每次改源数据后重新导入。

**第 3 步：改配置**

打开 `src/config.js`，把 `defaultSubject` 改成新题库里第一个科目的 key，`appName` 改成应用名。如果改了科目 key，还要同步改 `src/pages.json` 和 `src/manifest.json` 里的标题。

## 配置项

`src/config.js` 集中了这些配置：

| 字段 | 作用 |
| --- | --- |
| `appName` | 应用名 |
| `theme` | 主色、浅底、成功色、错误色 |
| `storagePrefix` | 本地存储键前缀，换前缀等于换一套独立数据 |
| `defaultSubject` | 默认科目 key |
| `practiceSizes` / `defaultSize` | 练习页题量选项和默认值 |
| `typeLabels` | 题型显示名 |

改主题色需要两处保持一致：`config.js` 的 `theme.primary` 给 switch 等原生组件用，`src/App.vue` 里的 CSS 变量给页面样式用。

## 目录结构

```text
quiz_app_template/
├─ src/
│  ├─ config.js             应用配置：名称、主题色、存储前缀、题量
│  ├─ data/
│  │  ├─ banks.json 的产出 ↓
│  │  ├─ questions.js       题库（生成，勿手改）
│  │  └─ meta.js            科目与章节（生成，勿手改）
│  ├─ utils/
│  │  ├─ bank.js            题库索引、答案判定、洗牌、组卷、自检
│  │  └─ store.js           错题本、收藏、进度、考试记录、数据导入导出
│  ├─ components/
│  │  └─ QuestionCard.vue   答题卡片，练习/背题/回顾共用
│  ├─ pages/
│  │  ├─ index/             首页：科目卡片与快捷入口
│  │  ├─ practice/          练习设置与答题
│  │  ├─ exam/              考试须知、答题、成绩单
│  │  ├─ review/            学习中心、题目列表、题目详情
│  │  └─ stats/             学习统计
│  ├─ static/               图标与启动图
│  ├─ pages.json            页面路由与 tabBar
│  ├─ manifest.json         应用清单、Android 包名
│  └─ App.vue               全局样式与启动初始化
├─ data/source/banks.json   题库源数据（改这里）
├─ tools/
│  ├─ import_questions.py   源数据 → 题库模块
│  └─ check_bank.mjs        题库格式校验
└─ README.md
```

## 打包 App

1. 用 HBuilderX 打开工程，确认 `src/manifest.json` 里的应用名、Android 包名和 appid 已改成自己的。appid 目前是占位符 `__UNI__XXXXXXX`，需要在 DCloud 开发者中心申请后替换。
2. HBuilderX 菜单「发行」→「原生 App 云打包」，按提示填写证书信息。
3. 图标在 `src/static/`，换成自己的图片资源。

私钥和签名文件已加入 `.gitignore`，不会误提交。

## 说明

- 所有学习数据存在本地 `uni.getStorageSync`，不上传服务器；清除应用数据会一并清掉。
- `store.js` 提供了 `exportData()` 和 `importData()`，需要备份或迁移数据时可以接出来用。
- 页面样式里主题色用 CSS 变量，原生组件的 `color` 属性从 `config.js` 读取。
- 题库内容中不要写「答案：A」之类的痕迹，`check:bank` 会检查题干里是否残留这类文字。
