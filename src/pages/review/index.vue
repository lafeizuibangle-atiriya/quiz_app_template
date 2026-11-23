<template>
  <view class="page">
    <view class="card hero">
      <view class="hero-title">学习中心</view>
      <view class="hero-sub">错题本 · 收藏 · 快捷入口</view>
    </view>

    <!-- 错题 / 收藏 -->
    <view class="grid2">
      <view class="g-item" @click="go('wrong')">
        <view class="g-num bad">{{ wbCount }}</view>
        <view class="g-label">错题本</view>
        <view class="g-desc">答错自动收录</view>
      </view>
      <view class="g-item" @click="go('fav')">
        <view class="g-num warn">{{ fvCount }}</view>
        <view class="g-label">我的收藏</view>
        <view class="g-desc">手动星标的题</view>
      </view>
    </view>

    <!-- 模拟考试入口 -->
    <view class="card">
      <view class="sec-title">模拟考试</view>
      <view class="exam-row" v-for="c in subjects" :key="c.key" @click="goExam(c.key)">
        <view class="ex-badge">{{ c.name }}</view>
        <view class="ex-main">
          <view class="ex-name">{{ c.full }}</view>
          <view class="muted">{{ c.examCount }} 题 / {{ c.examMinutes }} 分钟 · {{ lastScore(c.key) }}</view>
        </view>
        <view class="ex-arrow">→</view>
      </view>
    </view>

    <!-- 收藏 / 错题 快捷练习 -->
    <view class="card">
      <view class="sec-title">专项练习</view>
      <view class="act" v-if="wbCount" @click="practiceWrong">
        <view class="act-name">练习错题（{{ wbCount }} 题）</view>
        <view class="act-desc">把做错的题再刷一遍，答对即移出错题本</view>
      </view>
      <view class="act" v-if="fvCount" @click="practiceFav">
        <view class="act-name">练习收藏（{{ fvCount }} 题）</view>
        <view class="act-desc">复习你标记过的重点题</view>
      </view>
      <view v-if="!wbCount && !fvCount" class="muted">还没有错题和收藏。去刷题页开始练习吧。</view>
    </view>

    <!-- 数据管理 -->
    <view class="card">
      <view class="sec-title">数据管理</view>
      <view class="act danger" @click="clearWrong">
        <view class="act-name">清空错题本</view>
        <view class="act-desc">共 {{ wbCount }} 题，清空后不可恢复</view>
      </view>
      <view class="act danger" @click="resetAllData">
        <view class="act-name">重置全部学习数据</view>
        <view class="act-desc">清空错题本、收藏、进度与考试记录</view>
      </view>
    </view>
  </view>
</template>

<script>
import { SUBJECTS } from '../../utils/bank.js'
import config from '../../config.js'
import {wrongCount, favCount, clearWrongbook, resetAll, getExamRecords, K_LAST_SETUP } from '../../utils/store.js'

export default {
  data() {
    return {
      subjects: SUBJECTS,
      wbCount: 0,
      fvCount: 0
    }
  },
  onShow() {
    this.wbCount = wrongCount()
    this.fvCount = favCount()
  },
  methods: {
    lastScore(subjectKey) {
      const r = getExamRecords().find(x => x.subject === subjectKey)
      return r ? `上次 ${r.score} 分` : '暂无记录'
    },
    go(type) {
      uni.navigateTo({ url: '/pages/review/list?type=' + type })
    },
    goExam(subjectKey) {
      uni.navigateTo({ url: '/pages/exam/start?subject=' + subjectKey })
    },
    practiceWrong() {
      uni.setStorageSync(
        K_LAST_SETUP,
        JSON.stringify({ subject: config.defaultSubject, mode: 'special', special: 'wrong', size: 0, showExplain: true, autoNext: false })
      )
      uni.navigateTo({ url: '/pages/practice/quiz' })
    },
    practiceFav() {
      uni.setStorageSync(
        K_LAST_SETUP,
        JSON.stringify({ subject: config.defaultSubject, mode: 'special', special: 'fav', size: 0, showExplain: true, autoNext: false })
      )
      uni.navigateTo({ url: '/pages/practice/quiz' })
    },
    clearWrong() {
      if (!this.wbCount) {
        uni.showToast({ title: '错题本已是空的', icon: 'none' })
        return
      }
      uni.showModal({
        title: '清空错题本',
        content: `确定清空全部 ${this.wbCount} 道错题吗？此操作不可恢复。`,
        confirmColor: 'var(--danger)',
        success: res => {
          if (res.confirm) {
            clearWrongbook()
            this.wbCount = 0
            uni.showToast({ title: '已清空', icon: 'none' })
          }
        }
      })
    },
    resetAllData() {
      uni.showModal({
        title: '重置全部数据',
        content: '将清空错题本、收藏、答题进度和考试记录，且不可恢复。确定继续吗？',
        confirmColor: 'var(--danger)',
        success: res => {
          if (res.confirm) {
            resetAll()
            this.wbCount = 0
            this.fvCount = 0
            uni.showToast({ title: '已重置', icon: 'none' })
          }
        }
      })
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
  font-size: 40rpx;
  font-weight: 800;
  color: #ffffff;
}

.hero-sub {
  margin-top: 10rpx;
  font-size: 25rpx;
  color: rgba(255, 255, 255, 0.84);
}

.grid2 {
  display: flex;
  flex-direction: row;
  margin: 0 24rpx;
}

.g-item {
  flex: 1;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 34rpx 28rpx;
  margin-right: 18rpx;
  box-shadow: 0 2rpx 16rpx rgba(28, 35, 51, 0.05);
}

.g-item:last-child {
  margin-right: 0;
}

.g-num {
  font-size: 52rpx;
  font-weight: 800;
}

.g-num.bad {
  color: var(--danger);
}

.g-num.warn {
  color: #f5a623;
}

.g-label {
  margin-top: 10rpx;
  font-size: 29rpx;
  font-weight: 600;
}

.g-desc {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8b93a7;
}

.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1c2333;
  margin-bottom: 22rpx;
}

.exam-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 2rpx solid #f0f2f7;
}

.exam-row:last-child {
  border-bottom: none;
}

.ex-badge {
  flex: none;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 24rpx;
  font-weight: 700;
  padding: 8rpx 20rpx;
  border-radius: 10rpx;
  margin-right: 22rpx;
}

.ex-main {
  flex: 1;
}

.ex-name {
  font-size: 28rpx;
  color: #1c2333;
}

.ex-arrow {
  color: #c3cad9;
  font-size: 32rpx;
}

.act {
  padding: 22rpx 0;
  border-bottom: 2rpx solid #f0f2f7;
}

.act:last-child {
  border-bottom: none;
}

.act-name {
  font-size: 28rpx;
  color: var(--primary);
  font-weight: 600;
}

.act.danger .act-name {
  color: var(--danger);
}

.act-desc {
  margin-top: 6rpx;
  font-size: 23rpx;
  color: #8b93a7;
}
</style>
