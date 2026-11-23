<template>
  <view class="page">
    <!-- 科目卡片 -->
    <view class="subject" v-for="c in subjects" :key="c.key" @click="pickSubject(c)">
      <view class="subject-head">
        <view class="badge">{{ c.name }}</view>
        <view class="spacer"></view>
        <view class="code">{{ c.code }}</view>
      </view>
      <view class="subject-full">{{ c.full }}</view>
      <view class="subject-meta">
        <text>{{ c.chapters.length }} 章 · {{ c.total }} 题</text>
        <text class="dot">·</text>
        <text>考试 {{ c.examCount }} 题 / {{ c.examMinutes }} 分钟</text>
      </view>
      <view class="bar">
        <view class="bar-in" :style="{ width: progressOf(c.key).pct + '%' }"></view>
      </view>
      <view class="subject-stat">
        <text>已练 {{ progressOf(c.key).done }} / {{ c.total }} 题</text>
        <text class="spacer"></text>
        <text class="rate" v-if="progressOf(c.key).done">正确率 {{ progressOf(c.key).rate }}%</text>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick">
      <view class="q-item" @click="goWrong">
        <view class="q-num">{{ wbCount }}</view>
        <view class="q-label">错题本</view>
      </view>
      <view class="q-item" @click="goFav">
        <view class="q-num">{{ fvCount }}</view>
        <view class="q-label">我的收藏</view>
      </view>
      <view class="q-item" @click="goStats">
        <view class="q-num">{{ overall.rate }}%</view>
        <view class="q-label">总正确率</view>
      </view>
    </view>

    <view class="tip">
      题库自带答案与解析。练习时作答前不显示答案，答对标绿、答错标红并标出正确项。
    </view>
  </view>
</template>

<script>
import { SUBJECTS, questionsOfSubject } from '../../utils/bank.js'
import { getProgress, wrongCount, favCount } from '../../utils/store.js'

export default {
  data() {
    return {
      subjects: SUBJECTS
    }
  },
  computed: {
    wbCount() {
      return this.$data._wbCount || 0
    },
    fvCount() {
      return this.$data._fvCount || 0
    },
    overall() {
      return this.$data._overall || { rate: 0 }
    }
  },
  onShow() {
    this.refresh()
  },
  methods: {
    refresh() {
      const pr = getProgress()
      // 每个科目的进度
      const cache = {}
      let done = 0
      let right = 0
      this.subjects.forEach(c => {
        const qs = questionsOfSubject(c.key)
        let d = 0
        let r = 0
        qs.forEach(q => {
          const it = pr[q.id]
          if (it && it.total > 0) {
            d += 1
            if (it.right > 0) r += 1
          }
        })
        cache[c.key] = {
          done: d,
          rate: d ? Math.round((r / d) * 100) : 0,
          pct: qs.length ? Math.round((d / qs.length) * 100) : 0
        }
        done += d
        right += r
      })
      this._prCache = cache
      this._wbCount = wrongCount()
      this._fvCount = favCount()
      this._overall = { rate: done ? Math.round((right / done) * 100) : 0 }
      // 触发视图更新
      this.$forceUpdate()
    },
    progressOf(key) {
      if (!this._prCache) {
        this.refresh()
      }
      return (this._prCache && this._prCache[key]) || { done: 0, rate: 0, pct: 0 }
    },
    pickSubject(c) {
      uni.navigateTo({ url: '/pages/practice/setup?subject=' + c.key })
    },
    goWrong() {
      uni.navigateTo({ url: '/pages/review/list?type=wrong' })
    },
    goFav() {
      uni.navigateTo({ url: '/pages/review/list?type=fav' })
    },
    goStats() {
      uni.switchTab({ url: '/pages/stats/index' })
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 40rpx;
}

.subject {
  background: #ffffff;
  border-radius: 24rpx;
  margin: 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(28, 35, 51, 0.05);
}

.subject-head {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.badge {
  background: var(--primary);
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 700;
  padding: 6rpx 20rpx;
  border-radius: 10rpx;
  letter-spacing: 2rpx;
}

.code {
  color: #8b93a7;
  font-size: 24rpx;
}

.subject-full {
  margin-top: 18rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #1c2333;
}

.subject-meta {
  margin-top: 10rpx;
  color: #7b8399;
  font-size: 24rpx;
}

.dot {
  margin: 0 10rpx;
}

.bar {
  height: 12rpx;
  border-radius: 6rpx;
  background: #eef1f7;
  margin-top: 24rpx;
  overflow: hidden;
}

.bar-in {
  height: 100%;
  background: var(--primary);
  border-radius: 6rpx;
  transition: width 0.3s;
}

.subject-stat {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 14rpx;
  color: #7b8399;
  font-size: 24rpx;
}

.rate {
  color: var(--success);
  font-weight: 600;
}

.quick {
  display: flex;
  flex-direction: row;
  margin: 8rpx 24rpx 0;
}

.q-item {
  flex: 1;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 26rpx 0;
  text-align: center;
  margin-right: 18rpx;
  box-shadow: 0 2rpx 16rpx rgba(28, 35, 51, 0.05);
}

.q-item:last-child {
  margin-right: 0;
}

.q-num {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--primary);
}

.q-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7b8399;
}

.tip {
  margin: 32rpx 24rpx;
  color: #9aa2b5;
  font-size: 23rpx;
  line-height: 1.7;
}
</style>
