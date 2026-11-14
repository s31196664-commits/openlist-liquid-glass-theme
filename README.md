# KK OpenList Liquid Glass

从自用 OpenList 版本提取的液态毛玻璃主题、圆角 UI 和壁纸切换组件。无需修改 OpenList 程序，在后台粘贴两段代码即可安装。

- 半透明面板、背景模糊、边缘高光、阴影和圆角控件。
- 浅色 / 深色模式、移动端布局、减少动态效果设置及不支持模糊时的回退。
- 双层壁纸淡入淡出、打乱队列逐张切换、刷新后记住队列。
- 支持自选图片目录或完整直链；默认不附带任何壁纸。

## 安装

1. 下载本仓库 ZIP，解压。
2. 打开 OpenList 后台 → 设置 → 全局；先备份原有“自定义头部”和“自定义内容”。不同版本的菜单名称可能略有差异。
3. 把 `dist/customize-head.html` 全文粘贴到“自定义头部”。
4. 把 `dist/customize-body.html` 全文粘贴到“自定义内容”。
5. 保存并刷新页面。未配置壁纸时显示渐变背景，切换按钮自动隐藏。

**壁纸放在 OpenList 的 `data/wallpapers/` 目录。** Linux 示例为 `/opt/openlist/data/wallpapers/`，Windows 示例为 `C:\OpenList\data\wallpapers\`。这些是示例路径，请按自己的安装位置调整。

磁盘目录本身不能直接被浏览器访问。需要在 OpenList 中创建本地存储，将它挂载为 `/_kk_wallpapers`，然后在 `src/config.js` 中填写图片文件名并重新构建。也可使用自己的静态资源服务。

完整步骤：[安装与卸载](docs/INSTALL.md) · [壁纸目录与配置](docs/WALLPAPERS.md)

## 文件

| 路径 | 用途 |
| --- | --- |
| `src/theme.css` | 毛玻璃、圆角、明暗模式、工具栏样式 |
| `src/wallpaper.js` | 壁纸加载、队列和切换逻辑 |
| `src/config.js` | 壁纸路径与可调选项 |
| `dist/customize-head.html` | 可直接粘贴的头部代码 |
| `dist/customize-body.html` | 可直接粘贴的内容代码 |
| `dist/settings.json` | 仅含两个自定义字段，供手动查看或自行集成 |
| `wallpapers/` | 只含目录说明，没有图片 |

## 开发与打包

构建仅需 Python 3.9+，无需安装 Python 依赖。测试需要 Node.js 18+。

```sh
python scripts/build.py
node --test tests/wallpaper.test.cjs
python scripts/build.py --zip
```

ZIP 输出到项目目录的上一级，只打包明确列出的源文件、文档和安装代码，不打包本地壁纸。

如需从本地目录生成壁纸清单（只读取文件名，不复制图片）：

```sh
python scripts/configure_wallpapers.py /opt/openlist/data/wallpapers
python scripts/build.py
```

生成的图片清单会出现在浏览器可见的自定义内容中，不要填写私密图片地址或长期访问凭据。发布自己的改版前，将 `src/config.js` 恢复为空清单，并重新构建。

## 兼容范围

适用于使用 Hope UI 和 `.obj-box`、`.body > .nav` 等结构的 OpenList 前端。主题保留了原版本的部分 Hope UI 生成类名，前端升级后可能需要调整选择器；不承诺适配所有 OpenList / AList 版本。管理页隐藏壁纸和切换按钮，玻璃 CSS 仍会作用于匹配的控件。

“液态毛玻璃”在此指半透明、背景模糊和边缘高光的视觉样式，不包含真实光学折射着色器。当前环境未运行完整 OpenList 服务，发布前验证覆盖构建和壁纸控制器，不等同于所有版本的整站兼容测试。

## 来源与许可

原主题基于 [wugeng20/openlist-glassmorphism-theme](https://github.com/wugeng20/openlist-glassmorphism-theme)，Copyright (c) 2025 G.E.N.G，MIT License。保留原许可及来源说明，见 [LICENSE](LICENSE) 和 [NOTICE](NOTICE)。

本仓库只发布主题代码，不包含 OpenList 服务端、原站数据库、账号、签名、公告、联系方式、Logo、头像或壁纸素材。图片由使用者自行准备并确认使用权限。
