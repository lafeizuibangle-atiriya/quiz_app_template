<template>
  <view class="page">
    <!-- 筛选 -->
    <view class="filters">
      <view :class="['f', type === 'wrong' ? 'on' : '']" @click="setType('wrong')">错题本 {{ wbN }}</view>
      <view :class="['f', type === 'fav' ? 'on' : '']" @click="setType('fav')">收藏 {{ fvN }}</view>
      <view class="spacer"></view>
      <view class="f2" @click="toggleOrder">{{ order === 'recent' ? '最近优先' : '错误最多' }}</view>
    </view>

    <view v-if="!list.length" class="empty">
      <view class="empty-ico">📚</view>
      <view class="empty-txt">{{ type === 'wrong' ? '错题本是空的，继续保持！' : '还没有收藏任何题目' }}</view>
    </view>

    <!-- 列表 -->
    <view v-for="item in list" :key="item.q.id" class="card">
      <view class="q-head">
        <view :class="['tag', item.q.type]">{{ typeLabel(item.q.type) }}</view>
        <view class="chap">{{ chapName(item.q) }}</view>
        <view class="spacer"></view>
        <view v-if="type === 'wrong'" class="cnt">错 {{ item.meta.count }} 次</view>
      </view>
      <view class="stem">{{ item.q.stem }}</view>
      <view class="ans-line">
        <text class="ans-lbl">正确答案</text>
        <text class="ans-val">{{ item.q.answer }}</text>
      </view>
      <view class="q-foot">
        <view class="q-act" @click="view(item.q)">查看详情</view>
        <view class="q-act" @click="practiceOne(item.q)">单题练习</view>
        <view class="spacer"></view>
        <view class="q-act danger" @click="remove(item.q)">{{ type === 'wrong' ? '移出错题' : '取消收藏' }}</view>
      </view>
    </view>

    <view v-if="list.length" class="foot">
      <view class="btn flex1" @click="practiceAll">练习本页 {{ list.length }} 题</view>
    </view>
  </view>
</template>

<script>
import { getQuestion, chapterOf, TYPE_LABEL } from '../../utils/bank.js'
import {getWrongbook, getFavorites, removeWrong, toggleFav, K_LAST_SETUP } from '../../utils/store.js'

export default {
  data() {
    return {
      type: 'wrong',
      order: 'recent',
      list: [],
      wbN: 0,
      fvN: 0
    }
  },
  onLoad(opt) {
    this.type = opt.type === 'fav' ? 'fav' : 'wrong'
    this.build()
  },
  onShow() {
    this.build()
  },
  methods: {
    setType(t) {
      this.type = t
      this.build()
      uni.setNavigationBarTitle({ title: t === 'wrong' ? '错题本' : '我的收藏' })
    },
    toggleOrder() {
      this.order = this.order === 'recent' ? 'count' : 'recent'
      this.build()
    },
    build() {
      const wb = getWrongbook()
      const fv = getFavorites()
      this.wbN = Object.keys(wb).length
      this.fvN = Object.keys(fv).length
      const src = this.type === 'wrong' ? wb : fv
      let arr = Object.keys(src)
        .map(id => {
          const q = getQuestion(id)
          if (!q) return null
          return { q, meta: src[id] || {} }
        })
        .filter(Boolean)
      if (this.type === 'wrong') {
        arr.sort((a, b) => {
          if (this.order === 'count') return (b.meta.count || 0) - (a.meta.count || 0)
          return (b.meta.last || 0) - (a.meta.last || 0)
        })
      } else {
        arr.sort((a, b) => (b.meta || 0) - (a.meta || 0))
      }
      this.list = arr
      uni.setNavigationBarTitle({ title: this.type === 'wrong' ? '错题本' : '我的收藏' })
    },
    typeLabel(t) {
      return TYPE_LABEL[t] || t
    },
    chapName(q) {
      const ch = chapterOf(q.subject, q.chapter)
      return (ch ? ch.name : '') + ' · ' + q.subject.toUpperCase()
    },
    view(q) {
      uni.navigateTo({ url: '/pages/review/detail?id=' + q.id })
    },
    practiceOne(q) {
      uni.setStorageSync(
        K_LAST_SETUP,
        JSON.stringify({ subject: q.subject, mode: 'special', ids: [q.id], size: 0, showExplain: true, autoNext: false })
      )
      uni.navigateTo({ url: '/pages/practice/quiz' })
    },
    practiceAll() {
      const ids = this.list.map(x => x.q.id)
      uni.setStorageSync(
        K_LAST_SETUP,
        JSON.stringify({ subject: this.list[0].q.subject, mode: 'special', ids, size: 0, showExplain: true, autoNext: false })
      )
      uni.navigateTo({ url: '/pages/practice/quiz' })
    },
    remove(q) {
      const label = this.type === 'wrong' ? '移出错题本' : '取消收藏'
      uni.showModal({
        title: label,
        content: '确定要' + label + '吗？',
        success: res => {
          if (!res.confirm) return
          if (this.type === 'wrong') removeWrong(q.id)
          else toggleFav(q.id)
          this.build()
        }
      })
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 200rpx;
}

.filters {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #ffffff;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 12rpx rgba(28, 35, 51, 0.04);
}

.f {
  font-size: 26rpx;
  color: #5a6379;
  background: #f0f2f7;
  border-radius: 999rpx;
  padding: 10rpx 26rpx;
  margin-right: 16rpx;
}

.f.on {
  background: var(--primary);
  color: #ffffff;
  font-weight: 600;
}

.f2 {
  font-size: 24rpx;
  color: var(--primary);
}

.empty {
  padding: 160rpx 0;
  text-align: center;
}

.empty-ico {
  font-size: 90rpx;
}

.empty-txt {
  margin-top: 20rpx;
  color: #9aa2b5;
  font-size: 27rpx;
}

.q-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 21rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.tag.multi {
  background: #fdf0dc;
  color: #b3730a;
}

.tag.judge {
  background: var(--success-light);
  color: #0d7a3c;
}

.chap {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #9aa2b5;
}

.cnt {
  font-size: 22rpx;
  color: var(--danger);
  font-weight: 600;
}

.stem {
  font-size: 28rpx
  ;
  line-height: 1.6;
  color: #1c2333;
  word-break: break-word;
}

.ans-line {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.ans-lbl {
  font-size: 22rpx;
  color: #0d7a3c;
  background: var(--success-light);
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  margin-right: 14rpx;
}

.ans-val {
  font-size: 27rpx;
  font-weight: 700;
  color: #0d7a3c;
}

.q-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid #f0f2f7;
}

.q-act {
  font-size: 25rpx;
  color: var(--primary);
  margin-right: 28rpx;
}

.q-act.danger {
  color: var(--danger);
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
  padding: 24rpx 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

.flex1 {
  flex: 1;
}
</style>
