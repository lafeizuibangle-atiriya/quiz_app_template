<template>
  <view class="quiz-page">
    <!-- 顶部进度条 -->
    <view class="topbar">
      <view class="tb-row">
        <view class="tb-title">
          <text class="tb-mode">{{ modeName }}</text>
          <text class="tb-sub">{{ subject.name }} · {{ answered }}/{{ list.length }}</text>
        </view>
        <view class="tb-right">
          <text class="tb-acc" v-if="answered">正确率 {{ accRate }}%</text>
        </view>
      </view>
      <view class="pbar">
        <view class="pbar-in" :style="{ width: pct + '%' }"></view>
      </view>
    </view>

    <!-- 答题内容 -->
    <scroll-view class="body" scroll-y :scroll-top="scrollTop">
      <view class="body-inner">
        <view class="card">
          <QuestionCard
            v-if="q"
            :q="q"
            :index="idx"
            :total="list.length"
            :picked="picked"
            :revealed="revealed"
            :verdict="verdict"
            :showExplain="showExplainActive && revealed"
            :isFav="fav"
            @pick="onPick"
            @fav="onFav"
          />
        </view>
        <view class="pad"></view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom">
      <!-- 多选未交卷 -->
      <view v-if="q && q.type === 'multi' && !revealed" class="brow">
        <view :class="['btn', 'ghost', 'flex1', picked.length ? '' : 'disabled']" @click="clearPick">清空</view>
        <view :class="['btn', 'flex2', picked.length ? '' : 'disabled']" @click="confirmMulti">确认答案</view>
      </view>

      <!-- 已揭晓：下一题 -->
      <view v-else-if="revealed" class="brow">
        <view :class="['btn', verdict === false ? 'plain' : 'ghost', 'flex1']" @click="onFav">
          {{ fav ? '已收藏 ★' : '收藏 ☆' }}
        </view>
        <view :class="['btn', 'flex2']" @click="next">{{ isLast ? '完成练习' : '下一题 →' }}</view>
      </view>

      <!-- 背题模式 / 判断题答完自动揭晓前的操作 -->
      <view v-else class="brow">
        <view class="btn ghost flex1" @click="skip">跳过</view>
        <view :class="['btn', 'flex2', picked.length ? '' : 'disabled']" @click="confirmSingle">确认答案</view>
      </view>
    </view>

    <!-- 结果弹层 -->
    <view v-if="finished" class="mask">
      <view class="dialog">
        <view class="d-title">练习完成</view>
        <view class="d-score">{{ rightCount }}<text class="d-total">/{{ answeredTotal }}</text></view>
        <view class="d-rate">正确率 {{ finishRate }}%</view>
        <view class="d-stat">
          <view class="ds-item">
            <view class="ds-num ok">{{ rightCount }}</view>
            <view class="ds-label">答对</view>
          </view>
          <view class="ds-item">
            <view class="ds-num bad">{{ answeredTotal - rightCount }}</view>
            <view class="ds-label">答错</view>
          </view>
          <view class="ds-item">
            <view class="ds-num">{{ list.length }}</view>
            <view class="ds-label">本次题量</view>
          </view>
        </view>
        <view class="d-btns">
          <view class="btn plain flex1" @click="restart">再练一轮</view>
          <view class="btn flex1 ml16" @click="exit">返回</view>
        </view>
        <view class="d-link" @click="gotoWrong">查看错题本 →</view>
      </view>
    </view>
  </view>
</template>

<script>
import QuestionCard from '../../components/QuestionCard.vue'
import config from '../../config.js'
import {
  getSubject,
  getQuestion,
  questionsOfChapter,
  questionsOfSubject,
  shuffle,
  sample,
  isCorrect
} from '../../utils/bank.js'
import {recordAnswer, addWrong, isFav, toggleFav, K_LAST_SETUP } from '../../utils/store.js'

export default {
  components: { QuestionCard },
  data() {
    return {
      cfg: null,
      subject: { name: '', chapters: [] },
      list: [],
      idx: 0,
      picked: [],
      revealed: false,
      verdict: null,
      fav: false,
      finished: false,
      rightCount: 0,
      answeredTotal: 0,
      scrollTop: 0
    }
  },
  computed: {
    q() {
      return this.list[this.idx] || null
    },
    isLast() {
      return this.idx >= this.list.length - 1
    },
    answered() {
      return this.answeredTotal
    },
    accRate() {
      return this.answeredTotal ? Math.round((this.rightCount / this.answeredTotal) * 100) : 0
    },
    finishRate() {
      return this.answeredTotal ? Math.round((this.rightCount / this.answeredTotal) * 100) : 0
    },
    pct() {
      return this.list.length ? Math.round(((this.idx + 1) / this.list.length) * 100) : 0
    },
    modeName() {
      const m = { order: '顺序练习', random: '随机练习', recite: '背题模式', special: '专项练习' }
      return m[this.cfg ? this.cfg.mode : 'order'] || '练习'
    },
    showExplainActive() {
      return this.cfg ? this.cfg.showExplain !== false : true
    }
  },
  onLoad() {
    let cfg = null
    try {
      const raw = uni.getStorageSync(K_LAST_SETUP)
      cfg = raw ? JSON.parse(raw) : null
    } catch (e) {
      cfg = null
    }
    this.cfg = cfg || { subject: config.defaultSubject, mode: 'order', chapters: [], size: config.defaultSize, showExplain: true, autoNext: true }
    this.subject = getSubject(this.cfg.subject) || { name: '', chapters: [] }
    uni.setNavigationBarTitle({ title: this.subject.name + ' ' + (this.cfg.mode === 'recite' ? '背题' : '练习') })
    this.build()
  },
  onBackPress() {
    if (!this.finished && this.answeredTotal > 0) {
      this.askExit()
      return true
    }
    return false
  },
  methods: {
    build() {
      const c = this.cfg
      let pool = []

      if (c.mode === 'special') {
        // 专项练习：按传入的题目 id 列表出题（错题本 / 收藏 / 单题）
        pool = (c.ids || []).map(id => getQuestion(id)).filter(Boolean)
        this.subject = getSubject((pool[0] && pool[0].subject) || c.subject) || this.subject
      } else if (c.mode === 'random') {
        pool = shuffle(questionsOfSubject(c.subject))
      } else {
        const chaps = c.chapters && c.chapters.length ? c.chapters : this.subject.chapters.map(x => x.id)
        chaps.forEach(id => {
          pool = pool.concat(questionsOfChapter(id, c.subject))
        })
        // 顺序练习保持题库原始顺序；背题模式也按顺序，便于系统复习
        if (c.mode !== 'order' && c.mode !== 'recite') pool = shuffle(pool)
      }

      if (c.size && c.size > 0 && c.size < pool.length) {
        pool = c.mode === 'order' || c.mode === 'recite' ? pool.slice(0, c.size) : sample(pool, c.size)
      }

      this.list = pool
      this.idx = 0
      this.answeredTotal = 0
      this.rightCount = 0
      this.finished = false
      if (!pool.length) {
        uni.showToast({ title: '没有可练习的题目', icon: 'none' })
        setTimeout(() => this.exit(), 900)
        return
      }
      this.loadQ()
    },
    loadQ() {
      this.picked = []
      this.verdict = null
      const q = this.q
      // 背题模式：直接揭晓答案，不做判定
      if (this.cfg.mode === 'recite') {
        this.revealed = true
      } else {
        this.revealed = false
      }
      this.fav = q ? isFav(q.id) : false
      this.scrollTop = this.scrollTop === 0 ? 1 : 0
    },
    onPick(letter) {
      const q = this.q
      if (!q) return
      if (this.revealed) return
      if (q.type === 'multi') {
        const i = this.picked.indexOf(letter)
        if (i >= 0) this.picked.splice(i, 1)
        else this.picked.push(letter)
      } else {
        this.picked = [letter]
        // 单选 / 判断：点选即判定
        this.grade()
      }
    },
    clearPick() {
      this.picked = []
    },
    confirmMulti() {
      if (!this.picked.length) return
      this.grade()
    },
    confirmSingle() {
      if (!this.picked.length) return
      this.grade()
    },
    grade() {
      const q = this.q
      const ok = isCorrect(q, this.picked)
      this.verdict = ok
      this.revealed = true
      this.answeredTotal += 1
      if (ok) this.rightCount += 1
      else addWrong(q.id)
      recordAnswer(q.id, ok)
      if (ok && this.cfg.autoNext && q.type !== 'multi') {
        // 答对自动下一题，给一点时间让用户看到结果
        setTimeout(() => {
          if (this.verdict === true && !this.finished) this.next()
        }, 650)
      }
    },
    skip() {
      this.revealed = true
      this.verdict = null
    },
    next() {
      if (this.isLast) {
        this.finished = true
        return
      }
      this.idx += 1
      this.loadQ()
    },
    onFav() {
      if (!this.q) return
      this.fav = toggleFav(this.q.id)
      uni.showToast({ title: this.fav ? '已收藏' : '已取消收藏', icon: 'none' })
    },
    restart() {
      this.finished = false
      this.build()
    },
    exit() {
      const pages = getCurrentPages()
      if (pages.length > 1) uni.navigateBack()
      else uni.switchTab({ url: '/pages/index/index' })
    },
    askExit() {
      uni.showModal({
        title: '退出练习',
        content: '本次练习进度将保留在错题本与统计中，确定退出吗？',
        success: res => {
          if (res.confirm) {
            const pages = getCurrentPages()
            if (pages.length > 1) uni.navigateBack()
            else uni.switchTab({ url: '/pages/index/index' })
          }
        }
      })
    },
    gotoWrong() {
      this.finished = false
      uni.navigateTo({ url: '/pages/review/list?type=wrong' })
    }
  }
}
</script>

<style scoped>
.quiz-page {
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

.tb-title {
  display: flex;
  flex-direction: column;
}

.tb-mode {
  font-size: 29rpx;
  font-weight: 700;
  color: #1c2333;
}

.tb-sub {
  font-size: 22rpx;
  color: #8b93a7;
  margin-top: 4rpx;
}

.tb-right {
  margin-left: auto;
}

.tb-acc {
  font-size: 24rpx;
  color: var(--success);
  font-weight: 600;
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
  padding: 24rpx 30rpx;
  font-size: 30rpx;
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

.btn.disabled {
  opacity: 0.45;
}

.flex1 {
  flex: 1;
}

.flex2 {
  flex: 2;
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
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.dialog {
  width: 580rpx;
  background: #ffffff;
  border-radius: 28rpx;
  padding: 48rpx 40rpx 36rpx;
  text-align: center;
}

.d-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1c2333;
}

.d-score {
  font-size: 88rpx;
  font-weight: 800;
  color: var(--primary);
  line-height: 1.2;
  margin-top: 16rpx;
}

.d-total {
  font-size: 34rpx;
  color: #9aa2b5;
  font-weight: 500;
}

.d-rate {
  font-size: 26rpx;
  color: var(--success);
  font-weight: 600;
}

.d-stat {
  display: flex;
  flex-direction: row;
  margin-top: 34rpx;
}

.ds-item {
  flex: 1;
}

.ds-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #1c2333;
}

.ds-num.ok {
  color: var(--success);
}

.ds-num.bad {
  color: var(--danger);
}

.ds-label {
  font-size: 23rpx;
  color: #8b93a7;
  margin-top: 6rpx;
}

.d-btns {
  display: flex;
  flex-direction: row;
  margin-top: 40rpx;
}

.d-link {
  margin-top: 26rpx;
  color: var(--primary);
  font-size: 26rpx;
}
</style>
