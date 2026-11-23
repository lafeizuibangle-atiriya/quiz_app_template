<template>
  <view class="page">
    <view class="card hero">
      <view class="hero-badge">{{ subject.name }}</view>
      <view class="hero-title">模拟考试</view>
      <view class="muted mt8">{{ subject.full }}</view>
    </view>

    <view class="card">
      <view class="sec-title">考试规则</view>
      <view class="rule" v-for="(r, i) in rules" :key="i">
        <view class="rule-no">{{ i + 1 }}</view>
        <view class="rule-text">{{ r }}</view>
      </view>
    </view>

    <view class="card">
      <view class="sec-title">章节权重（组卷依据）</view>
      <view class="wrow" v-for="ch in subject.chapters" :key="ch.id">
        <view class="w-name">{{ ch.name }}</view>
        <view class="w-bar">
          <view class="w-in" :style="{ width: barW(ch.weight) }"></view>
        </view>
        <view class="w-pct">{{ ch.weight }}</view>
      </view>
    </view>

    <view class="card">
      <view class="sec-title">上次成绩</view>
      <view v-if="last" class="last">
        <view class="last-score" :class="last.score >= 60 ? 'ok' : 'bad'">{{ last.score }}<text class="last-unit">分</text></view>
        <view class="last-meta">
          <view>{{ last.right }} / {{ last.total }} 题正确</view>
          <view class="muted">{{ fmtTime(last.ts) }}</view>
        </view>
      </view>
      <view v-else class="muted">还没有考试记录，来一次吧。</view>
      <view class="link-line" @click="goHistory">查看全部考试记录 →</view>
    </view>

    <view class="foot">
      <view class="btn big" @click="start">开始考试（{{ subject.examCount }} 题 / {{ subject.examMinutes }} 分钟）</view>
    </view>
  </view>
</template>

<script>
import { getSubject } from '../../utils/bank.js'
import config from '../../config.js'
import { getExamRecords } from '../../utils/store.js'

export default {
  data() {
    return {
      subject: null,
      last: null
    }
  },
  computed: {
    rules() {
      const c = this.subject
      if (!c) return []
      return [
        `共 ${c.examCount} 道题，答对 60% 及以上视为通过。`,
        `限时 ${c.examMinutes} 分钟，倒计时结束自动交卷。`,
        '按章节权重随机抽题，同一份试卷题目不重复。',
        '答题过程中不显示答案与解析，交卷后可逐题回顾。',
        '交卷后自动把答错的题加入错题本。'
      ]
    }
  },
  onLoad(opt) {
    this.subject = getSubject(opt.subject || config.defaultSubject)
    uni.setNavigationBarTitle({ title: this.subject.name + ' 模拟考试' })
  },
  onShow() {
    const recs = getExamRecords()
    this.last = recs.find(r => r.subject === this.subject.key) || null
  },
  methods: {
    barW(w) {
      const n = parseFloat(String(w).replace('%', '')) || 0
      // 以最大 20% 为满格
      return Math.min(100, Math.round((n / 20) * 100)) + '%'
    },
    fmtTime(ts) {
      const d = new Date(ts)
      const p = n => (n < 10 ? '0' + n : '' + n)
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    },
    start() {
      uni.navigateTo({ url: '/pages/exam/paper?subject=' + this.subject.key })
    },
    goHistory() {
      uni.navigateTo({ url: '/pages/stats/index?tab=exam' })
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 200rpx;
}

.hero {
  background: linear-gradient(135deg, var(--primary), #2f7bff);
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  padding: 6rpx 20rpx;
  border-radius: 10rpx;
  letter-spacing: 2rpx;
}

.hero-title {
  margin-top: 20rpx;
  font-size: 44rpx;
  font-weight: 800;
  color: #ffffff;
}

.hero .muted {
  color: rgba(255, 255, 255, 0.82);
}

.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1c2333;
  margin-bottom: 20rpx;
}

.mt8 {
  margin-top: 8rpx;
}

.rule {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.rule-no {
  flex: none;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 22rpx;
  font-weight: 700;
  text-align: center;
  line-height: 36rpx;
  margin-right: 16rpx;
  margin-top: 4rpx;
}

.rule-text {
  flex: 1;
  font-size: 27rpx;
  line-height: 1.6;
  color: #414a5e;
}

.wrow {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 18rpx;
}

.w-name {
  flex: none;
  width: 260rpx;
  font-size: 25rpx;
  color: #414a5e;
}

.w-bar {
  flex: 1;
  height: 14rpx;
  background: #eef1f7;
  border-radius: 7rpx;
  overflow: hidden;
  margin: 0 16rpx;
}

.w-in {
  height: 100%;
  background: var(--primary);
  border-radius: 7rpx;
}

.w-pct {
  flex: none;
  width: 70rpx;
  text-align: right;
  font-size: 24rpx;
  color: #7b8399;
}

.last {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.last-score {
  font-size: 62rpx;
  font-weight: 800;
  margin-right: 30rpx;
}

.last-score.ok {
  color: var(--success);
}

.last-score.bad {
  color: var(--danger);
}

.last-unit {
  font-size: 24rpx;
  font-weight: 500;
}

.last-meta {
  font-size: 26rpx;
  color: #414a5e;
  line-height: 1.7;
}

.link-line {
  margin-top: 24rpx;
  color: var(--primary);
  font-size: 26rpx;
}

.foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -2rpx 16rpx rgba(28, 35, 51, 0.06);
}

.btn {
  background: var(--primary);
  color: #ffffff;
  border-radius: 44rpx;
  padding: 24rpx 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

.btn.big {
  padding: 26rpx 44rpx;
}
</style>
