<template>
  <view class="exam-page">
    <!-- 顶部：倒计时 + 进度 -->
    <view class="topbar">
      <view class="tb-row">
        <view class="timer" :class="leftSec <= 300 ? 'warn' : ''">
          <text class="timer-ico">⏱</text>
          <text class="timer-txt">{{ timeText }}</text>
        </view>
        <view class="spacer"></view>
        <view class="tb-count">已答 {{ answeredCount }}/{{ list.length }}</view>
      </view>
      <view class="pbar">
        <view class="pbar-in" :style="{ width: pct + '%' }"></view>
      </view>
    </view>

    <scroll-view class="body" scroll-y :scroll-top="scrollTop">
      <view class="body-inner">
        <view class="card">
          <QuestionCard
            v-if="q"
            :q="q"
            :index="idx"
            :total="list.length"
            :picked="picked"
            :revealed="false"
            :verdict="null"
            :showExplain="false"
            :isFav="fav"
            @pick="onPick"
            @fav="onFav"
          />
        </view>
        <view class="pad"></view>
      </view>
    </scroll-view>

    <!-- 底部 -->
    <view class="bottom">
      <view class="brow">
        <view class="btn plain nav" @click="prev">上一题</view>
        <view class="btn ghost nav" @click="openSheet">答题卡</view>
        <view class="btn nav" @click="next">{{ isLast ? '交卷' : '下一题' }}</view>
      </view>
    </view>

    <!-- 答题卡抽屉 -->
    <view v-if="sheet" class="mask" @click="sheet = false">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <text class="sheet-title">答题卡</text>
          <text class="muted">{{ answeredCount }}/{{ list.length }} 已答</text>
        </view>
        <scroll-view class="sheet-body" scroll-y>
          <view class="grid">
            <view
              v-for="(it, i) in list"
              :key="it.id"
              :class="['cell', i === idx ? 'cur' : '', pickedOf(i).length ? 'done' : '']"
              @click="jumpTo(i)"
            >
              {{ i + 1 }}
            </view>
          </view>
        </scroll-view>
        <view class="sheet-foot">
          <view class="btn plain flex1" @click="sheet = false">继续答题</view>
          <view class="btn flex1 ml16" @click="confirmSubmit">交卷</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import QuestionCard from '../../components/QuestionCard.vue'
import config from '../../config.js'
import { getSubject, buildExamPaper } from '../../utils/bank.js'
import { isFav, toggleFav } from '../../utils/store.js'

export default {
  components: { QuestionCard },
  data() {
    return {
      subject: null,
      list: [],
      idx: 0,
      answers: {},
      remain: 0,
      timer: null,
      sheet: false,
      fav: false,
      scrollTop: 0,
      submitting: false
    }
  },
  computed: {
    q() {
      return this.list[this.idx] || null
    },
    picked() {
      return this.q ? this.answers[this.q.id] || [] : []
    },
    isLast() {
      return this.idx >= this.list.length - 1
    },
    answeredCount() {
      let n = 0
      this.list.forEach(it => {
        if ((this.answers[it.id] || []).length) n += 1
      })
      return n
    },
    pct() {
      return this.list.length ? Math.round(((this.idx + 1) / this.list.length) * 100) : 0
    },
    leftSec() {
      return this.remain
    },
    timeText() {
      const s = Math.max(0, this.remain)
      const m = Math.floor(s / 60)
      const ss = s % 60
      const p = n => (n < 10 ? '0' + n : '' + n)
      return `${p(m)}:${p(ss)}`
    }
  },
  onLoad(opt) {
    this.subject = getSubject(opt.subject || config.defaultSubject)
    uni.setNavigationBarTitle({ title: this.subject.name + ' 考试中' })
    this.list = buildExamPaper(this.subject.key, this.subject.examCount)
    this.answers = {}
    this.remain = this.subject.examMinutes * 60
    this.startTimer()
  },
  onUnload() {
    this.clearTimer()
  },
  onBackPress() {
    this.confirmQuit()
    return true
  },
  methods: {
    startTimer() {
      this.clearTimer()
      this.timer = setInterval(() => {
        this.remain -= 1
        if (this.remain <= 0) {
          this.clearTimer()
          this.doSubmit(true)
        }
      }, 1000)
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    pickedOf(i) {
      return this.answers[this.list[i].id] || []
    },
    onPick(letter) {
      const q = this.q
      if (!q) return
      const cur = this.answers[q.id] || []
      if (q.type === 'multi') {
        const i = cur.indexOf(letter)
        const nx = cur.slice()
        if (i >= 0) nx.splice(i, 1)
        else nx.push(letter)
        this.answers = { ...this.answers, [q.id]: nx }
      } else {
        this.answers = { ...this.answers, [q.id]: [letter] }
        // 单选/判断：选完稍作停留自动跳下一题
        if (!this.isLast) {
          setTimeout(() => {
            if (!this.sheet) this.next()
          }, 260)
        }
      }
    },
    onFav() {
      if (!this.q) return
      // 考试中收藏静默切换，不弹提示打断答题
      this.fav = toggleFav(this.q.id)
    },
    prev() {
      if (this.idx > 0) {
        this.idx -= 1
        this.refreshFav()
      }
    },
    next() {
      if (this.isLast) {
        this.confirmSubmit()
        return
      }
      this.idx += 1
      this.refreshFav()
    },
    refreshFav() {
      this.fav = this.q ? isFav(this.q.id) : false
      this.scrollTop = this.scrollTop === 0 ? 1 : 0
    },
    jumpTo(i) {
      this.idx = i
      this.sheet = false
      this.refreshFav()
    },
    openSheet() {
      this.sheet = true
    },
    confirmSubmit() {
      const blank = this.list.length - this.answeredCount
      uni.showModal({
        title: '确认交卷',
        content: blank > 0 ? `还有 ${blank} 题未作答，确定交卷吗？` : '已全部作答，确定交卷吗？',
        success: res => {
          if (res.confirm) this.doSubmit(false)
        }
      })
    },
    confirmQuit() {
      uni.showModal({
        title: '退出考试',
        content: '退出后本次考试不计入成绩，确定退出吗？',
        success: res => {
          if (res.confirm) {
            this.clearTimer()
            const pages = getCurrentPages()
            if (pages.length > 1) uni.navigateBack()
            else uni.switchTab({ url: '/pages/index/index' })
          }
        }
      })
    },
    doSubmit(auto) {
      if (this.submitting) return
      this.submitting = true
      this.clearTimer()
      try {
        uni.setStorageSync(
          'hosquiz_exam_pending',
          JSON.stringify({
            subject: this.subject.key,
            answers: this.answers,
            ids: this.list.map(x => x.id),
            auto: !!auto,
            usedSec: this.subject.examMinutes * 60 - Math.max(0, this.remain)
          })
        )
      } catch (e) {
        // 存储失败时降级为内存传递（同页跳转可用）
        getApp().globalData = getApp().globalData || {}
        getApp().globalData.examPending = {
          subject: this.subject.key,
          answers: this.answers,
          ids: this.list.map(x => x.id),
          auto: !!auto
        }
      }
      uni.redirectTo({ url: '/pages/exam/result' })
    }
  }
}
</script>

<style scoped>
.exam-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f2f4f8;
}

.topbar {
  flex: none;
  background: #ffffff;
  padding: 20rpx 28rpx 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(28, 35, 51, 0.04);
}

.tb-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.timer {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: var(--primary-light);
  border-radius: 999rpx;
  padding: 8rpx 24rpx;
}

.timer.warn {
  background: var(--danger-light);
}

.timer-ico {
  font-size: 26rpx;
  margin-right: 8rpx;
}

.timer-txt {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: 0.5rpx;
}

.timer.warn .timer-txt {
  color: var(--danger);
}

.tb-count {
  font-size: 25rpx;
  color: #7b8399;
}

.pbar {
  height: 8rpx;
  border-radius: 4rpx;
  background: #eef1f7;
  margin-top: 16rpx;
  overflow: hidden;
}

.pbar-in {
  height: 100%;
  background: var(--primary);
  border-radius: 4rpx;
  transition: width 0.25s;
}

.body {
  flex: 1;
  overflow: hidden;
}

.body-inner {
  padding-bottom: 20rpx;
}

.pad {
  height: 20rpx;
}

.bottom {
  flex: none;
  background: #ffffff;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -2rpx 16rpx rgba(28, 35, 51, 0.06);
}

.brow {
  display: flex;
  flex-direction: row;
  align-items: center;
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

.btn.nav {
  flex: 1;
  margin-right: 14rpx;
}

.btn.nav:last-child {
  margin-right: 0;
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

.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(20, 26, 40, 0.45);
  z-index: 99;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sheet {
  background: #ffffff;
  border-radius: 28rpx 28rpx 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.sheet-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 16rpx;
}

.sheet-title {
  font-size: 31rpx;
  font-weight: 700;
}

.sheet-body {
  flex: 1;
  max-height: 46vh;
  padding: 0 24rpx;
}

.grid {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.cell {
  width: 88rpx;
  height: 88rpx;
  border-radius: 16rpx;
  border: 2rpx solid #e0e5ef;
  background: #f7f9fc;
  color: #5a6379;
  font-size: 28rpx;
  text-align: center;
  line-height: 84rpx;
  margin: 8rpx;
}

.cell.done {
  background: var(--primary-light);
  border-color: #b6cdfd;
  color: var(--primary);
  font-weight: 600;
}

.cell.cur {
  border-color: var(--primary);
  border-width: 4rpx;
  line-height: 80rpx;
}

.sheet-foot {
  display: flex;
  flex-direction: row;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  border-top: 2rpx solid #f0f2f7;
}
</style>
