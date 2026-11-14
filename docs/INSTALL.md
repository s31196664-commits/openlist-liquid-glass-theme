# 安装与卸载

## 使用现成文件

1. 备份 OpenList 后台当前“自定义头部”和“自定义内容”，保留一条可进入管理后台的浏览器会话。
2. 用 `dist/customize-head.html` 的全文替换“自定义头部”。
3. 用 `dist/customize-body.html` 的全文替换“自定义内容”。
4. 保存并刷新页面。两份文件已包含 `<style>` / `<script>` 标签，不需要再套一层。

如果原有字段还包含其他需要的自定义代码，请自行合并，避免重复插入同一份主题。

`dist/settings.json` 不是 OpenList 数据库备份，也不是完整的配置文件。不要用它覆盖 `data/config.json`，不要直接写入运行中的数据库。

## 配置壁纸后重新构建

编辑 `src/config.js`，执行：

```sh
python scripts/build.py
```

再把新的 `dist/customize-body.html` 粘贴到后台。修改 CSS 后也要重新构建并更新头部。

## 调整外观

在 `src/theme.css` 顶部修改变量：

| 变量 | 作用 |
| --- | --- |
| `--kk-glass` | 普通面板透明度 |
| `--kk-glass-raised` | 弹窗与浮层底色 |
| `--kk-blur` | 模糊半径，默认 18px；移动端 13px |
| `--kk-edge` | 边框颜色 |
| `--kk-shadow` | 外部阴影与内侧高光 |

深色模式在 `.hope-ui-dark` 中单独定义。圆角位于 `.obj-box`、`.body > .nav`、`.hope-button` 等选择器中。

## 故障排查

- 只有渐变：检查 `wallpapers` 是否为空，直链能否在当前登录状态下打开，以及存储是否启用。
- 图片 403：检查访客的读取权限和链接签名；不要为了显示壁纸开放其他私有目录。
- 修改未生效：确认重新构建并更新了后台字段，再强制刷新浏览器。
- 没有模糊：确认浏览器支持 `backdrop-filter`；旧浏览器会回退为较实的面板背景。
- 样式错位：前端版本可能更改了 Hope UI 类名，检查选择器。可先还原自定义字段恢复原界面。
- 存储被禁用：切换队列回退为当前页面内存；跨刷新记忆不可用。

## 卸载

恢复安装前备份的两项自定义内容，或删除本主题的 `<style id="kk-openlist-glass">` 和壁纸脚本，然后刷新页面。

主题只使用浏览器本地队列，不修改 OpenList 的文件、数据库、用户或挂载设置。需要清理记录时，可在浏览器网站存储中删除 `kk-openlist-wallpaper-queue-v2`。
