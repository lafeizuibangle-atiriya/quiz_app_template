<template>
  <view class="qcard">
    <!-- 元信息 -->
    <view class="qmeta">
      <view class="pill">{{ typeLabel }}</view>
      <view class="idx">{{ index + 1 }} / {{ total }}</view>
      <view class="spacer"></view>
      <view class="fav" @click="$emit('fav')">
        <text :class="['star', isFav ? 'on' : '']">{{ isFav ? '★' : '☆' }}</text>
      </view>
    </view>

    <!-- 题干 -->
    <view class="stem">{{ q.stem }}</view>

    <!-- 选项 -->
    <view class="opts">
      <view
        v-for="o in opts"
        :key="o.letter"
        :class="['opt', optClass(o.letter)]"
        @click="onTap(o.letter)"
      >
        <view class="letter">{{ o.letter }}</view>
        <view class="otext">{{ o.text }}</view>
        <view v-if="tagOf(o.letter)" :class="['tag', tagOf(o.letter).cls]">
          {{ tagOf(o.letter).text }}
        </view>
      </view>
    </view>

    <!-- 多选提示 -->
    <view v-if="q.type === 'multi' && !revealed" class="hint">
      多选题：选好全部选项后点下方「确认答案」
    </view>

    <!-- 反馈 -->
    <view v-if="revealed" :class="['fb', fbClass]">
      <view v-if="verdict === true" class="fb-title">回答正确 ✓</view>
      <view v-else-if="verdict === false" class="fb-title">
        回答错误 ✗<text class="fb-ans">　正确答案：{{ q.answer }}</text>
      </view>
      <view v-else class="fb-title">已作答　正确答案：{{ q.answer }}</view>
    </view>

    <!-- 解析 -->
    <view v-if="showExplain" class="expl">
      <view class="expl-title">题目解析</view>
      <view class="expl-body">{{ q.explain || '本题暂无解析。' }}</view>
    </view>
  </view>
</template>

<script>
import { optionsOf, answerSet, TYPE_LABEL } from '../utils/bank.js'

export default {
  name: 'QuestionCard',
  props: {
    q: { type: Object, required: true },
    index: { type: Number, default: 0 },
    total: { type: Number, default: 1 },
    /** 当前已选项（字母数组 / 判断题传 '正确'|'错误'） */
    picked: { type: Array, default: () => [] },
    /** 是否已揭晓答案（练习答完 / 背题模式 / 考试回顾） */
    revealed: { type: Boolean, default: false },
    /** 是否正确：null 表示"只揭晓不判定"（背题模式） */
    verdict: { type: [Boolean, null], default: null },
    /** 是否展示解析 */
    showExplain: { type: Boolean, default: false },
    isFav: { type: Boolean, default: false },
    /** 是否可点击（考试回顾、背题模式锁定） */
    lockable: { type: Boolean, default: false }
  },
  emits: ['pick', 'fav'],
  computed: {
    opts() {
      return optionsOf(this.q)
    },
    typeLabel() {
      return TYPE_LABEL[this.q.type] || ''
    },
    fbClass() {
      if (this.verdict === true) return 'ok'
      if (this.verdict === false) return 'bad'
      return 'neutral'
    }
  },
  methods: {
    onTap(letter) {
      if (this.lockable) return
      if (this.revealed && this.q.type !== 'multi') return
      this.$emit('pick', letter)
    },
    optClass(letter) {
      const picked = this.picked.indexOf(letter) >= 0
      if (!this.revealed) {
        return picked ? 'sel' : ''
      }
      const a = answerSet(this.q)
      const isAns = a ? a.has(letter) : false
      if (isAns) return 'correct'
      if (picked) return 'wrong'
      return 'dim'
    },
    tagOf(letter) {
      if (!this.revealed) return null
      const a = answerSet(this.q)
      const inAns = a ? a.has(letter) : false
      const picked = this.picked.indexOf(letter) >= 0
      if (inAns) return { text: '正确答案', cls: 'ok' }
      if (picked) return { text: '你的选择', cls: 'bad' }
      return null
    }
  }
}
</script>

<style scoped>
.qcard {
  padding: 4rpx 0;
}

.qmeta {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}

.pill {
  background: var(--primary-light);
  color: var(--primary);
  font-size: 23rpx;
  font-weight: 600;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
}

.idx {
  margin-left: 16rpx;
  color: #8b93a7;
  font-size: 24rpx;
}

.star {
  font-size: 44rpx;
  color: #c7cddb;
  line-height: 1;
}

.star.on {
  color: #f5a623;
}

.stem {
  font-size: 31rpx;
  line-height: 1.65;
  color: #1c2333;
  margin-bottom: 28rpx;
  word-break: break-word;
}

.opts {
  display: flex;
  flex-direction: column;
}

.opt {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #f7f9fc;
  border: 2rpx solid #e6eaf2;
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
}

.opt .letter {
  flex: none;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #e6eaf2;
  color: #5a6379;
  font-size: 26rpx;
  font-weight: 600;
  text-align: center;
  line-height: 48rpx;
  margin-right: 20rpx;
}

/* 判断题的字母是「正确 / 错误」，用胶囊样式 */
.opt .letter.letter-word,
.opt .letter {
  white-space: nowrap;
}

.opt .otext {
  flex: 1;
  font-size: 29rpx;
  line-height: 1.55;
  word-break: break-word;
}

.opt.sel {
  border-color: var(--primary);
  background: var(--primary-light);
}
.opt.sel .letter {
  background: var(--primary);
  color: #ffffff;
}

.opt.correct {
  border-color: var(--success);
  background: var(--success-light);
}
.opt.correct .letter {
  background: var(--success);
  color: #ffffff;
}

.opt.wrong {
  border-color: var(--danger);
  background: var(--danger-light);
}
.opt.wrong .letter {
  background: var(--danger);
  color: #ffffff;
}

.opt.dim {
  opacity: 0.62;
}

.tag {
  flex: none;
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  margin-left: 14rpx;
  white-space: nowrap;
}

.tag.ok {
  background: #d8f2e4;
  color: #0d7a3c;
}

.tag.bad {
  background: #fbd9d5;
  color: #b32413;
}

.hint {
  color: #8b93a7;
  font-size: 24rpx;
  margin: 4rpx 0 8rpx;
}

.fb {
  margin-top: 16rpx;
  border-radius: 16rpx;
  padding: 22rpx 24rpx;
  font-size: 28rpx;
}

.fb.ok {
  background: var(--success-light);
  border: 2rpx solid #bfe8d2;
  color: #0d7a3c;
}

.fb.bad {
  background: var(--danger-light);
  border: 2rpx solid #f6c9c3;
  color: #b32413;
}

.fb.neutral {
  background: #eef1f7;
  border: 2rpx solid #e0e5ef;
  color: #414a5e;
}

.fb-title {
  font-weight: 700;
}

.fb-ans {
  font-weight: 400;
  font-size: 26rpx;
}

.expl {
  margin-top: 22rpx;
  background: #f6f8fc;
  border: 2rpx solid #e3e8f2;
  border-radius: 16rpx;
  padding: 26rpx;
}

.expl-title {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 12rpx;
}

.expl-body {
  font-size: 27rpx;
  line-height: 1.75;
  color: #4a5468;
  word-break: break-word;
}
</style>
