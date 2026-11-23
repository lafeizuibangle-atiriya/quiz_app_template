<template>
  <view class="page" v-if="q">
    <view class="card">
      <QuestionCard
        :q="q"
        :index="0"
        :total="1"
        :picked="[]"
        :revealed="true"
        :verdict="null"
        :showExplain="true"
        :isFav="fav"
        :lockable="true"
        @fav="onFav"
      />
    </view>

    <view class="card">
      <view class="sec-title">归属信息</view>
      <view class="info"><text class="k">所属科目</text><text class="v">{{ q.subject.toUpperCase() }}</text></view>
      <view class="info"><text class="k">所属章节</text><text class="v">{{ chapName }}</text></view>
      <view class="info"><text class="k">题目类型</text><text class="v">{{ typeLabel }}</text></view>
      <view class="info"><text class="k">正确答案</text><text class="v ok">{{ q.answer }}</text></view>
      <view class="info" v-if="wrongTimes"><text class="k">历史错题</text><text class="v bad">{{ wrongTimes }} 次</text></view>
      <view class="info" v-if="prog"><text class="k">作答记录</text><text class="v">{{ prog.right }}/{{ prog.total }} 正确</text></view>
    </view>

    <view class="foot">
      <view class="btn flex1" @click="practice">练习这道题</view>
    </view>
  </view>
</template>

<script>
import QuestionCard from '../../components/QuestionCard.vue'
import { getQuestion, chapterOf, TYPE_LABEL } from '../../utils/bank.js'
import {isFav, toggleFav, getWrongbook, getProgress, K_LAST_SETUP } from '../../utils/store.js'

export default {
  components: { QuestionCard },
  data() {
    return {
      q: null,
      fav: false,
      wrongTimes: 0,
      prog: null
    }
  },
  computed: {
    chapName() {
      if (!this.q) return ''
      const ch = chapterOf(this.q.subject, this.q.chapter)
      return ch ? ch.name : ''
    },
    typeLabel() {
      return this.q ? TYPE_LABEL[this.q.type] : ''
    }
  },
  onLoad(opt) {
    const q = getQuestion(opt.id)
    if (!q) {
      uni.showToast({ title: '题目不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 800)
      return
    }
    this.q = q
    this.fav = isFav(q.id)
    const wb = getWrongbook()
    this.wrongTimes = wb[q.id] ? wb[q.id].count : 0
    const pr = getProgress()
    this.prog = pr[q.id] || null
  },
  methods: {
    onFav() {
      this.fav = toggleFav(this.q.id)
      uni.showToast({ title: this.fav ? '已收藏' : '已取消收藏', icon: 'none' })
    },
    practice() {
      uni.setStorageSync(
        K_LAST_SETUP,
        JSON.stringify({ subject: this.q.subject, mode: 'special', ids: [this.q.id], size: 0, showExplain: true, autoNext: false })
      )
      uni.navigateTo({ url: '/pages/practice/quiz' })
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 200rpx;
}

.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1c2333;
  margin-bottom: 20rpx;
}

.info {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f0f2f7;
}

.info:last-child {
  border-bottom: none;
}

.k {
  flex: none;
  width: 180rpx;
  font-size: 26rpx;
  color: #8b93a7;
}

.v {
  flex: 1;
  font-size: 27rpx;
  color: #1c2333;
}

.v.ok {
  color: #0d7a3c;
  font-weight: 700;
}

.v.bad {
  color: var(--danger);
  font-weight: 700;
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
