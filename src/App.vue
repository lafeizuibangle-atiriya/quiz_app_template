<script>
import { ensureStoreInit } from './utils/store.js'
import { validateBank } from './utils/bank.js'

export default {
  onLaunch() {
    // 初始化本地存储（错题本 / 收藏 / 进度 / 考试记录）
    ensureStoreInit()
    // 开发期自检：题库配置有误时在控制台给出具体提示
    // eslint-disable-next-line no-undef
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      const problems = validateBank()
      if (problems.length) {
        console.warn('[题库自检] 发现 ' + problems.length + ' 个问题：')
        problems.forEach(p => console.warn('  - ' + p))
      }
    }
  }
}
</script>

<style>
/* ========== 全局主题 ========== */
/* 主题色可通过 src/config.js 的 theme 字段修改：
   页面样式使用的是这里的 CSS 变量，switch 等原生组件的 color 属性走 config.js。
   改主题色时两处保持一致即可。 */
page {
  --primary: #2b6cb0;
  --primary-light: #eaf2fb;
  --success: #2f855a;
  --success-light: #e8f6ee;
  --danger: #c53030;
  --danger-light: #fdecec;

  background: #f2f4f8;
  color: #1c2333;
  font-size: 28rpx;
  font-family: -apple-system, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 通用卡片 */
.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(28, 35, 51, 0.05);
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.spacer {
  flex: 1;
}

.muted {
  color: #7b8399;
  font-size: 24rpx;
}

/* 主按钮 */
.btn {
  background: var(--primary);
  color: #ffffff;
  border-radius: 44rpx;
  padding: 22rpx 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
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

.btn[disabled] {
  opacity: 0.45;
}

/* 选项 */
.opt {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #f7f9fc;
  border: 2rpx solid #e6eaf2;
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
}

.opt .letter {
  flex: none;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #e6eaf2;
  color: #5a6379;
  font-size: 26rpx;
  font-weight: 600;
  text-align: center;
  line-height: 48rpx;
  margin-right: 20rpx;
}

.opt .otext {
  flex: 1;
  font-size: 29rpx;
  line-height: 1.55;
  word-break: break-word;
}

/* 已选 */
.opt.sel {
  border-color: var(--primary);
  background: var(--primary-light);
}
.opt.sel .letter {
  background: var(--primary);
  color: #ffffff;
}

/* 答对 */
.opt.correct {
  border-color: var(--success);
  background: var(--success-light);
}
.opt.correct .letter {
  background: var(--success);
  color: #ffffff;
}

/* 答错 */
.opt.wrong {
  border-color: var(--danger);
  background: var(--danger-light);
}
.opt.wrong .letter {
  background: var(--danger);
  color: #ffffff;
}
</style>
