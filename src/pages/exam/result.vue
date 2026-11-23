<template>
  <view class="page">
    <!-- 成绩卡 -->
    <view :class="['hero', passed ? 'pass' : 'fail']">
      <view class="hero-label">{{ auto ? '时间到，已自动交卷' : '本次模拟考试成绩' }}</view>
      <view class="hero-score">{{ score }}<text class="hero-unit">分</text></view>
      <view class="hero-badge">{{ passed ? '通过 ✓' : '未通过' }}</view>
      <view class="hero-meta">
        <text>答对 {{ right }} / {{ total }} 题</text>
        <text class="dot">·</text>
        <text>用时 {{ usedText }}</text>
      </view>
    </view>

    <!-- 概览 -->
    <view class="card">
      <view class="ov">
        <view class="ov-item">
          <view class="ov-num ok">{{ right }}</view>
          <view class="ov-label">答对</view>
        </view>
        <view class="ov-item">
          <view class="ov-num bad">{{ wrong }}</view>
          <view class="ov-label">答错</view>
        </view>
        <view class="ov-item">
          <view class="ov-num">{{ blank }}</view>
          <view class="ov-label">未答</view>
        </view>
        <view class="ov-item">
          <view class="ov-num">{{ score }}</view>
          <view class="ov-label">得分</view>
        </view>
      </view>
    </view>

    <!-- 按章节得分 -->
    <view class="card">
      <view class="sec-title">各章节正确率</view>
      <view class="crow" v-for="c in chapterStats" :key="c.name">
        <view class="c-name">{{ c.name }}</view>
        <view class="c-bar">
          <view class="c-in" :style="{ width: c.rate + '%', background: c.rate >= 60 ? 'var(--success)' : 'var(--danger)' }"></view>
        </view>
        <view class="c-txt">{{ c.right }}/{{ c.total }}</view>
      </view>
    </view>

    <!-- 逐题回顾 -->
    <view class="card">
      <view class="sec-title">
        逐题回顾
        <text class="link" @click="onlyWrong = !onlyWrong">{{ onlyWrong ? '查看全部' : '只看错题' }}</text>
      </view>
      <view v-for="(item, i) in shownList" :key="item.q.id" class="rv">
        <view class="rv-head">
          <view :class="['rv-tag', item.ok ? 'ok' : item.blank ? 'blank' : 'bad']">
            {{ item.ok ? '正确' : item.blank ? '未答' : '错误' }}
          </view>
          <view class="rv-idx">第 {{ item.no }} 题</view>
        </view>
        <QuestionCard
          :q="item.q"
          :index="item.no - 1"
          :total="total"
          :picked="item.picked"
          :revealed="true"
          :verdict="item.ok"
          :showExplain="true"
          :isFav="item.fav"
          :lockable="true"
          @fav="toggleItemFav(item)"
        />
      </view>
      <view v-if="!shownList.length" class="muted center">全部答对，没有错题 🎉</view>
    </view>

    <view class="foot">
      <view class="btn plain flex1" @click="goWrong">错题本</view>
      <view class="btn ghost flex1 ml16" @click="again">再考一次</view>
      <view class="btn flex1 ml16" @click="backHome">回首页</view>
    </view>
  </view>
</template>

<script>
import QuestionCard from '../../components/QuestionCard.vue'
import config from '../../config.js'
import { getQuestion, isCorrect, chapterOf, TYPE_LABEL } from '../../utils/bank.js'
import { addExamRecord, addWrong, isFav, toggleFav, recordAnswer } from '../../utils/store.js'

const PASS = 60

export default {
  components: { QuestionCard },
  data() {
    return {
      subject: null,
      items: [],
      auto: false,
      usedSec: 0,
      onlyWrong: false,
      score: 0,
      right: 0,
      wrong: 0,
      blank: 0,
      total: 0
    }
  },
  computed: {
    passed() {
      return this.score >= PASS
    },
    usedText() {
      const s = this.usedSec || 0
      const m = Math.floor(s / 60)
      const ss = s % 60
      return m > 0 ? `${m} 分 ${ss} 秒` : `${ss} 秒`
    },
    shownList() {
      if (!this.onlyWrong) return this.items
      return this.items.filter(x => !x.ok)
    },
    chapterStats() {
      const map = {}
      this.items.forEach(it => {
        const ch = chapterOf(it.q.subject, it.q.chapter)
        const name = ch ? ch.name : '其他'
        if (!map[name]) map[name] = { name, total: 0, right: 0 }
        map[name].total += 1
        if (it.ok) map[name].right += 1
      })
      return Object.keys(map).map(k => {
        const m = map[k]
        return { name: m.name, total: m.total, right: m.right, rate: Math.round((m.right / m.total) * 100) }
      })
    }
  },
  onLoad() {
    let data = null
    try {
      const raw = uni.getStorageSync('hosquiz_exam_pending')
      data = raw ? JSON.parse(raw) : null
      uni.removeStorageSync('hosquiz_exam_pending')
    } catch (e) {
      data = null
    }
    if (!data) {
      const g = getApp().globalData || {}
      data = g.examPending || null
      if (g) g.examPending = null
    }
    if (!data) {
      uni.showModal({ title: '数据丢失', content: '未找到本次考试数据，请重新开始。', showCancel: false, success: () => this.backHome() })
      return
    }
    this.auto = !!data.auto
    this.usedSec = data.usedSec || 0
    this.subject = { key: data.subject, name: (data.subject || '').toUpperCase() }
    uni.setNavigationBarTitle({ title: '考试成绩' })

    const items = []
    let right = 0
    let wrong = 0
    let blank = 0
    ;(data.ids || []).forEach((id, i) => {
      const q = getQuestion(id)
      if (!q) return
      const picked = (data.answers && data.answers[id]) || []
      const isBlank = picked.length === 0
      const ok = isBlank ? false : isCorrect(q, picked) === true
      if (isBlank) blank += 1
      else if (ok) right += 1
      else wrong += 1
      items.push({ q, no: i + 1, picked, ok, blank: isBlank, fav: isFav(id) })
    })
    this.items = items
    this.total = items.length
    this.right = right
    this.wrong = wrong
    this.blank = blank
    this.score = this.total ? Math.round((right / this.total) * 100) : 0

    // 落库：错题 + 统计 + 考试记录
    items.forEach(it => {
      if (it.blank) return
      recordAnswer(it.q.id, it.ok)
      if (!it.ok) addWrong(it.q.id)
    })
    addExamRecord({
      subject: data.subject,
      ts: Date.now(),
      score: this.score,
      total: this.total,
      right: this.right,
      wrong: this.wrong + this.blank,
      usedSec: this.usedSec
    })
  },
  methods: {
    toggleItemFav(item) {
      item.fav = toggleFav(item.q.id)
      uni.showToast({ title: item.fav ? '已收藏' : '已取消收藏', icon: 'none' })
    },
    goWrong() {
      uni.navigateTo({ url: '/pages/review/list?type=wrong' })
    },
    again() {
      uni.redirectTo({ url: '/pages/exam/paper?subject=' + (this.subject ? this.subject.key : config.defaultSubject) })
    },
    backHome() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 200rpx;
}

.hero {
  margin: 24rpx;
  border-radius: 24rpx;
  padding: 44rpx 32rpx;
  color: #ffffff;
  text-align: center;
}

.hero.pass {
  background: linear-gradient(135deg, var(--success), #1fc46b);
}

.hero.fail {
  background: linear-gradient(135deg, #d92c1a, #ef5b45);
}

.hero-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.hero-score {
  font-size: 104rpx;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 8rpx;
}

.hero-unit {
  font-size: 32rpx;
  font-weight: 500;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 999rpx;
  padding: 8rpx 28rpx;
  font-size: 26rpx;
  font-weight: 700;
  margin-top: 8rpx;
}

.hero-meta {
  margin-top: 22rpx;
  font-size: 25rpx;
  opacity: 0.92;
}

.dot {
  margin: 0 12rpx;
}

.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1c2333;
  margin-bottom: 22rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.link {
  margin-left: auto;
  color: var(--primary);
  font-size: 25rpx;
  font-weight: 400;
}

.ov {
  display: flex;
  flex-direction: row;
}

.ov-item {
  flex: 1;
  text-align: center;
}

.ov-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #1c2333;
}

.ov-num.ok {
  color: var(--success);
}

.ov-num.bad {
  color: var(--danger);
}

.ov-label {
  font-size: 23rpx;
  color: #8b93a7;
  margin-top: 6rpx;
}

.crow {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 18rpx;
}

.c-name {
  flex: none;
  width: 230rpx;
  font-size: 25rpx;
  color: #414a5e;
}

.c-bar {
  flex: 1;
  height: 14rpx;
  background: #eef1f7;
  border-radius: 7rpx;
  overflow: hidden;
  margin: 0 16rpx;
}

.c-in {
  height: 100%;
  border-radius: 7rpx;
}

.c-txt {
  flex: none;
  width: 110rpx;
  text-align: right;
  font-size: 24rpx;
  color: #7b8399;
}

.rv {
  padding: 26rpx 0;
  border-top: 2rpx solid #f0f2f7;
}

.rv-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 18rpx;
}

.rv-tag {
  font-size: 22rpx;
  font-weight: 700;
  padding: 5rpx 18rpx;
  border-radius: 8rpx;
}

.rv-tag.ok {
  background: var(--success-light);
  color: #0d7a3c;
}

.rv-tag.bad {
  background: var(--danger-light);
  color: #b32413;
}

.rv-tag.blank {
  background: #eef1f7;
  color: #6b7488;
}

.rv-idx {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #8b93a7;
}

.foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -2rpx 16rpx rgba(28, 35, 51, 0.06);
}

.btn {
  background: var(--primary);
  color: #ffffff;
  border-radius: 44rpx;
  padding: 22rpx 20rpx;
  font-size: 28rpx;
  font-weight: 600;
  text-align: center;
}

.btn.ghost {
  background: #ffffff;
  color: var(--primary);
  border: 2rpx solid var(--primary);
}

.btn.plain {
  background: #eef1f7;
  color: #414a5e;
}

.flex1 {
  flex: 1;
}

.ml16 {
  margin-left: 16rpx;
}

.center {
  text-align: center;
  padding: 40rpx 0;
}
</style>
