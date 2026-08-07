# 会话页设计 QA

- 日期：2026-08-07
- 源视觉真值：`/var/folders/j1/blrv77y956q8d747sb8pqfvm0000gp/T/codex-clipboard-dc8d9aa9-8426-4869-9ba2-9658ac7a0dfe.png`
- 桌面实现截图：`/Users/suqing/.codex/visualizations/2026/08/07/019fdb40-8b80-7871-a55a-620e2a7bbf02/session-qa-2/desktop-copy-action-visible.png`
- 手机实现截图：`/Users/suqing/.codex/visualizations/2026/08/07/019fdb40-8b80-7871-a55a-620e2a7bbf02/session-qa-2/mobile-bubbles.png`
- 页面：`http://127.0.0.1:9821/sessions/qiyi-feishu-work-codex/s7`

## 对照条件

- 源截图为 2514×764 像素的桌面消息区裁切，未提供 CSS viewport 或设备像素比。
- 桌面实现按 2048×1150 CSS viewport、1× 截图；因源图是局部裁切，重点对照同一条用户消息及其上一条助手消息的复制操作区。
- 手机实现按 390×844 CSS viewport、1× 截图，验证响应式换行和横向溢出。
- 状态：浅色主题、同一项目和会话、同一条 `/devops/tools/dumpDBIODetail` 用户消息；桌面截图包含复制按钮悬停态。

## 全视图与局部证据

- 全视图：会话列表、消息区、用户头像和底部 Bridge 告警保持原结构；消息区未出现横向滚动。
- 局部：用户气泡桌面宽度 376.09px，父级最大宽度为消息行的 72%；手机宽度 257.76px，页面宽度与 viewport 均为 390px。
- 复制按钮：桌面悬停态 `opacity: 1`，按钮矩形与下一条用户气泡矩形无交集；按钮所在操作行参与普通文档流。
- 浏览器控制台：未发现 error 级日志。

## 必查视觉面

- 字体与排版：沿用现有 Ant Design 字体、字号和行高；长路径与中文混排正常换行。
- 间距与布局：复制操作位于助手气泡下方的独立操作行；用户气泡按内容收缩，长内容达到 72% 上限后换行。
- 颜色与 token：继续使用现有 `--cc-color-*` 和阴影 token，没有新增脱离主题的颜色。
- 图像与图标：继续使用 `@ant-design/icons` 的复制和头像图标，无新增替代资产。
- 文案与内容：消息正文和复制语义未改变；复制按钮增加了可访问名称。

## 比较历史

1. 初始截图发现 P1：复制按钮以绝对定位悬浮在助手气泡下方，覆盖下一条用户消息边界。
   - 修复：把复制按钮移入助手消息的独立流式操作行，并保留 hover/focus 显示。
   - 复查：桌面实现截图中按钮与用户气泡不相交，自动化几何检测 `overlap: false`。
2. 初始截图发现 P1：所有消息气泡使用固定 `width: min(820px, 92%)`，短用户消息也被拉长。
   - 修复：消息气泡改为 `fit-content`；用户消息框最大宽度设为 72%，长内容自动换行。
   - 复查：桌面和 390px 手机视口均按内容收缩，无横向溢出。

## 剩余边界

- 本次只修改前端消息布局；未启用 Bridge，也未执行真实 Agent/IM live E2E。
- Vitest 的 jsdom 仍输出既有 CSS 解析和 Ant Design `Collapse` 高度警告，但 38 项测试全部通过，浏览器实测没有对应错误。

final result: passed
