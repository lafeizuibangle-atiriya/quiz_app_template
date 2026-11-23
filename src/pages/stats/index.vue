<template>
  <view class="page">
    <!-- 总览 -->
    <view class="card hero">
      <view class="hero-title">学习统计</view>
      <view class="hero-grid">
        <view class="hg-item">
          <view class="hg-num">{{ overall.done }}</view>
          <view class="hg-label">已练题数</view>
        </view>
        <view class="hg-item">
          <view class="hg-num ok">{{ overall.rate }}%</view>
          <view class="hg-label">总正确率</view>
        </view>
        <view class="hg-item">
          <view class="hg-num">{{ allTotal }}</view>
          <view class="hg-label">题库总量</view>
        </view>
      </view>
      <view class="hero-bar">
        <view class="hb-in" :style="{ width: coverPct + '%' }"></view>
      </view>
      <view class="hero-foot">题库覆盖率 {{ coverPct }}% · 已练 {{ overall.done }} / {{ allTotal }}</view>
    </view>

    <!-- 分科目 -->
    <view class="card" v-for="c in stats" :key="c.key">
      <view class="row">
        <view class="badge">{{ c.name }}</view>
        <view class="spacer"></view>
        <view class="muted">{{ c.code }}</view>
      </view>
      <view class="cbar">
        <view class="cbar-in" :style="{ width: c.pct + '%' }"></view>
      </view>
      <view class="cmeta">
        <text>已练 {{ c.done }} / {{ c.total }}</text>
        <text class="spacer"></text>
        <text :class="c.rate >= 60 ? 'ok' : 'bad'">正确率 {{ c.rate }}%</text>
      </view>

      <view class="sec-sub">各章节掌握度</view>
      <view class="chrow" v-for="ch in c.chapters" :key="ch.id">
        <view class="ch-name">{{ ch.name }}</view>
        <view class="ch-bar">
          <view
            class="ch-in"
            :style="{ width: ch.pct + '%', background: ch.pct >= 60 ? 'var(--success)' : ch.pct > 0 ? 'var(--primary)' : '#d8dde8' }"
          ></view>
        </view>
        <view class="ch-txt">{{ ch.done }}/{{ ch.total }}</view>
      </view>
    </view>

    <!-- 考试记录 -->
    <view class="card">
      <view class="sec-title">考试记录</view>
      <view v-if="!records.length" class="muted">还没有考试记录。</view>
      <view v-for="(r, i) in records" :key="i" class="rec">
        <view class="rec-left">
          <view class="rec-subject">{{ (r.subject || '').toUpperCase() }}</view>
          <view class="muted">{{ fmt(r.ts) }}</view>
        </view>
        <view class="spacer"></view>
        <view :class="['rec-score', r.score >= 60 ? 'ok' : 'bad']">{{ r.score }} 分</view>
        <view class="rec-detail">{{ r.right }}/{{ r.total }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import { SUBJECTS, questionsOfSubject, questionsOfChapter } from '../../utils/bank.js'
import { getProgress, getExamRecords } from '../../utils/store.js'

export default {
  data() {
    return {
      stats: [],
      overall: { done: 0, right: 0, rate: 0 },
      allTotal: 0,
      records: []
    }
  },
  computed: {
    coverPct() {
      return this.allTotal ? Math.round((this.overall.done / this.allTotal) * 100) : 0
    }
  },
  onShow() {
    this.build()
  },
  methods: {
    build() {
      const pr = getProgress()
      let done = 0
      let right = 0
      let totalAll = 0

      this.stats = SUBJECTS.map(c => {
        const qs = questionsOfSubject(c.key)
        let d = 0
        let r = 0
        const chapters = c.chapters.map(ch => {
          const cq = questionsOfChapter(ch.id, c.key)
          let cd = 0
          let cr = 0
          cq.forEach(q => {
            const it = pr[q.id]
            if (it && it.total > 0) {
              cd += 1
              if (it.right > 0) cr += 1
            }
          })
          d += cd
          r += cr
          return { id: ch.id, name: ch.name, total: cq.length, done: cd, pct: cq.length ? Math.round((cd / cq.length) * 100) : 0 }
        })
        done += d
        right += r
        totalAll += qs.length
        return {
          key: c.key,
          name: c.name,
          code: c.code,
          total: qs.length,
          done: d,
          right: r,
          rate: d ? Math.round((r / d) * 100) : 0,
          pct: qs.length ? Math.round((d / qs.length) * 100) : 0,
          chapters
        }
      })

      this.allTotal = totalAll
      this.overall = { done, right, rate: done ? Math.round((right / done) * 100) : 0 }
      this.records = getExamRecords()
    },
    fmt(ts) {
      const d = new Date(ts)
      const p = n => (n < 10 ? '0' + n : '' + n)
      return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 40rpx;
}

.hero {
  background: linear-gradient(135deg, var(--primary), #2f7bff);
}

.hero-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #ffffff;
}

.hero-grid {
  display: flex;
  flex-direction: row;
  margin-top: 30rpx;
}

.hg-item {
  flex: 1;
  text-align: center;
}

.hg-num {
  font-size: 46rpx;
  font-weight: 800;
  color: #ffffff;
}

.hg-num.ok {
  color: #b7f7d0;
}

.hg-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 6rpx;
}

.hero-bar {
  height: 12rpx;
  border-radius: 6rpx;
  background: rgba(255, 255, 255, 0.28);
  margin-top: 30rpx;
  overflow: hidden;
}

.hb-in {
  height: 100%;
  background: #ffffff;
  border-radius: 6rpx;
}

.hero-foot {
  margin-top: 14rpx;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.85);
}

.badge {
  background: var(--primary);
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  padding: 5rpx 18rpx;
  border-radius: 9rpx;
  letter-spacing: 1rpx;
}

.cbar {
  height: 12rpx;
  border-radius: 6rpx;
  background: #eef1f7;
  margin-top: 22rpx;
  overflow: hidden;
}

.cbar-in {
  height: 100%;
  background: var(--primary);
  border-radius: 6rpx;
}

.cmeta {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #7b8399;
}

.cmeta .ok {
  color: var(--success);
  font-weight: 600;
}

.cmeta .bad {
  color: var(--danger);
  font-weight: 600;
}

.sec-sub {
  margin-top: 30rpx;
  margin-bottom: 18rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #414a5e;
}

.chrow {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}

.ch-name {
  flex: none;
  width: 250rpx;
  font-size: 24rpx;
  color: #5a6379;
}

.ch-bar {
  flex: 1;
  height: 12rpx;
  background: #eef1f7;
  border-radius: 6rpx;
  overflow: hidden;
  margin: 0 14rpx;
}

.ch-in {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s;
}

.ch-txt {
  flex: none;
  width: 100rpx;
  text-align: right;
  font-size: 22rpx;
  color: #9aa2b5;
}

.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1c2333;
  margin-bottom: 20rpx;
}

.rec {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f0f2f7;
}

.rec:last-child {
  border-bottom: none;
}

.rec-subject {
  font-size: 27rpx;
  font-weight: 700;
  color: #1c2333;
}

.rec-score {
  font-size: 32rpx;
  font-weight: 800;
  margin-right: 20rpx;
}

.rec-score.ok {
  color: var(--success);
}

.rec-score.bad {
  color: var(--danger);
}

.rec-detail {
  font-size: 23rpx;
  color: #8b93a7;
}
</style>
