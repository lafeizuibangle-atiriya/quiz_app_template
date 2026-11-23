<template>
  <view class="page">
    <!-- 科目信息 -->
    <view class="card head">
      <view class="row">
        <view class="badge">{{ subject.name }}</view>
        <view class="spacer"></view>
        <view class="muted">{{ subject.code }}</view>
      </view>
      <view class="title">{{ subject.full }}</view>
      <view class="muted mt8">{{ subject.chapters.length }} 章 · {{ subject.total }} 题已入库</view>
    </view>

    <!-- 模式 -->
    <view class="card">
      <view class="sec-title">练习模式</view>
      <view class="modes">
        <view
          v-for="m in modes"
          :key="m.key"
          :class="['mode', mode === m.key ? 'on' : '']"
          @click="mode = m.key"
        >
          <view class="mode-name">{{ m.name }}</view>
          <view class="mode-desc">{{ m.desc }}</view>
        </view>
      </view>
    </view>

    <!-- 章节（顺序/背题模式可选章节） -->
    <view class="card" v-if="mode !== 'random'">
      <view class="sec-title">
        选择章节
        <text class="link" @click="toggleAll">{{ allSel ? '取消全选' : '全选' }}</text>
      </view>
      <view
        v-for="ch in subject.chapters"
        :key="ch.id"
        :class="['chap', pickedChaps.indexOf(ch.id) >= 0 ? 'on' : '']"
        @click="toggleChap(ch.id)"
      >
        <view class="ck">{{ pickedChaps.indexOf(ch.id) >= 0 ? '✓' : '' }}</view>
        <view class="chap-main">
          <view class="chap-name">{{ ch.name }}</view>
          <view class="muted">{{ ch.count }} 题 · 权重 {{ ch.weight }}</view>
        </view>
      </view>
    </view>

    <!-- 题量 -->
    <view class="card">
      <view class="sec-title">本次题量</view>
      <view class="sizes">
        <view
          v-for="n in sizes"
          :key="n.value"
          :class="['size', size === n.value ? 'on' : '']"
          @click="size = n.value"
        >
          <view class="size-num">{{ n.label }}</view>
          <view class="size-desc">{{ n.desc }}</view>
        </view>
      </view>
      <view class="muted mt8">可用题目：{{ availCount }} 道</view>
    </view>

    <!-- 开关 -->
    <view class="card">
      <view class="switch-row">
        <view>
          <view class="sw-name">答题后立即显示解析</view>
          <view class="muted">练习模式下答完即看解析</view>
        </view>
        <switch :checked="showExplain" :color="primaryColor" @change="showExplain = $event.detail.value" />
      </view>
      <view class="switch-row" v-if="mode === 'order'">
        <view>
          <view class="sw-name">答对自动进入下一题</view>
          <view class="muted">答错时停留，方便看解析</view>
        </view>
        <switch :checked="autoNext" :color="primaryColor" @change="autoNext = $event.detail.value" />
      </view>
    </view>

    <!-- 开始 -->
    <view class="foot">
      <view :class="['btn', 'big', canStart ? '' : 'disabled']" @click="start">开始练习</view>
      <view v-if="!canStart" class="muted center mt8">请至少选择一个章节</view>
    </view>
  </view>
</template>

<script>
import { getSubject } from '../../utils/bank.js'
import config from '../../config.js'

export default {
  data() {
    return {
      subject: null,
      modes: [
        { key: 'order', name: '顺序练习', desc: '按题库顺序逐题作答' },
        { key: 'random', name: '随机练习', desc: '全库随机抽题，打乱顺序' },
        { key: 'recite', name: '背题模式', desc: '直接显示答案与解析' }
      ],
      mode: 'order',
      pickedChaps: [],
      sizes: config.practiceSizes,
      size: config.defaultSize,
      showExplain: true,
      autoNext: true
    }
  },
  computed: {
    allSel() {
      return this.pickedChaps.length === this.subject.chapters.length
    },
    availCount() {
      if (this.mode === 'random') return this.subject.total
      let n = 0
      this.subject.chapters.forEach(ch => {
        if (this.pickedChaps.indexOf(ch.id) >= 0) n += ch.count
      })
      return n
    },
    canStart() {
      return this.mode === 'random' || this.pickedChaps.length > 0
    }
  },
  onLoad(opt) {
    const subject = getSubject(opt.subject || config.defaultSubject)
    this.subject = subject
    this.pickedChaps = subject.chapters.map(ch => ch.id)
    uni.setNavigationBarTitle({ title: subject.name + ' 练习设置' })
  },
  methods: {
    toggleChap(id) {
      const i = this.pickedChaps.indexOf(id)
      if (i >= 0) this.pickedChaps.splice(i, 1)
      else this.pickedChaps.push(id)
    },
    toggleAll() {
      this.pickedChaps = this.allSel ? [] : this.subject.chapters.map(ch => ch.id)
    },
    start() {
      if (!this.canStart) return
      const payload = {
        subject: this.subject.key,
        mode: this.mode,
        chapters: this.mode === 'random' ? [] : this.pickedChaps.slice(),
        size: this.size,
        showExplain: this.showExplain,
        autoNext: this.autoNext
      }
      uni.setStorageSync(K_LAST_SETUP, JSON.stringify(payload))
      uni.navigateTo({ url: '/pages/practice/quiz' })
    }
  }
}
</script>

<style scoped>
.page {
  padding-bottom: 200rpx;
}

.head .badge {
  background: var(--primary);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
  padding: 6rpx 20rpx;
  border-radius: 10rpx;
  letter-spacing: 2rpx;
}

.title {
  margin-top: 18rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.mt8 {
  margin-top: 8rpx;
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

.modes {
  display: flex;
  flex-direction: row;
}

.mode {
  flex: 1;
  border: 2rpx solid #e6eaf2;
  background: #f7f9fc;
  border-radius: 18rpx;
  padding: 22rpx 14rpx;
  margin-right: 16rpx;
  text-align: center;
}

.mode:last-child {
  margin-right: 0;
}

.mode.on {
  border-color: var(--primary);
  background: var(--primary-light);
}

.mode-name {
  font-size: 28rpx;
  font-weight: 600;
}

.mode.on .mode-name {
  color: var(--primary);
}

.mode-desc {
  font-size: 21rpx;
  color: #8b93a7;
  margin-top: 8rpx;
  line-height: 1.4;
}

.chap {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20rpx 4rpx;
  border-bottom: 2rpx solid #f0f2f7;
}

.chap:last-child {
  border-bottom: none;
}

.ck {
  flex: none;
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  border: 2rpx solid #cfd6e4;
  color: #fff;
  font-size: 26rpx;
  text-align: center;
  line-height: 40rpx;
  margin-right: 20rpx;
}

.chap.on .ck {
  background: var(--primary);
  border-color: var(--primary);
}

.chap-main {
  flex: 1;
}

.chap-name {
  font-size: 28rpx;
  color: #1c2333;
}

.sizes {
  display: flex;
  flex-direction: row;
}

.size {
  flex: 1;
  border: 2rpx solid #e6eaf2;
  background: #f7f9fc;
  border-radius: 18rpx;
  padding: 20rpx 0;
  margin-right: 16rpx;
  text-align: center;
}

.size:last-child {
  margin-right: 0;
}

.size.on {
  border-color: var(--primary);
  background: var(--primary-light);
}

.size-num {
  font-size: 30rpx;
  font-weight: 700;
}

.size.on .size-num {
  color: var(--primary);
}

.size-desc {
  font-size: 21rpx;
  color: #8b93a7;
  margin-top: 6rpx;
}

.switch-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 0;
}

.sw-name {
  font-size: 28rpx;
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
  font-size: 31rpx;
  font-weight: 600;
  text-align: center;
}

.btn.big {
  padding: 26rpx 44rpx;
}

.btn.disabled {
  opacity: 0.45;
}

.center {
  text-align: center;
}
</style>
