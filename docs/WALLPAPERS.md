# 壁纸目录与配置

仓库与发布包**不包含壁纸图片**，也不包含原站的图片清单和签名链接。你需要自行放置图片并配置访问地址。

## 目录约定

| 环境 | 磁盘目录示例 | 说明 |
| --- | --- | --- |
| Linux | `/opt/openlist/data/wallpapers/` | 根据 OpenList 实际安装目录调整 |
| Windows | `C:\OpenList\data\wallpapers\` | 根据 OpenList 实际安装目录调整 |
| Docker | `/opt/openlist/data/wallpapers/` | 以容器内实际挂载路径为准，不是宿主机路径 |
| 本仓库 | `wallpapers/` | 仅为目录占位，不会自动上传或挂载 |

只把准备作为页面背景使用的图片放在该目录。建议横屏、体积适中的 WebP / JPG / AVIF 图片。

## 方案一：OpenList 本地存储

1. 将图片放到 OpenList 数据目录下的 `wallpapers/`，例如 `landscape-01.webp` 和 `landscape-02.webp`。
2. 后台添加“本地 / Local”存储，根文件夹填写上面的实际磁盘目录，挂载路径填写 `/_kk_wallpapers`。确保 OpenList 进程有读取权限。
3. 根据站点权限设置，让需要看见背景的用户能够读取该专用目录。测试图片直链是否可访问。
4. 修改 `src/config.js`：

```js
window.KK_OPENLIST_THEME = {
  basePath: '/d/_kk_wallpapers/',
  wallpapers: [
    { file: 'landscape-01.webp', title: '风景一' },
    { file: 'landscape-02.webp', title: '风景二' }
  ],
  storageKey: 'kk-openlist-wallpaper-queue-v2',
  loadTimeout: 8000,
  showButton: true
};
```

5. 执行 `python scripts/build.py`，把生成的内容文件重新粘贴到后台。

`basePath` 是浏览器访问的 URL 前缀，不能填 `C:\...` 或 `/opt/...` 磁盘路径。若 OpenList 部署在子路径，填写实际可用的直链前缀。

`file` 会按路径段自动编码，支持中文、空格和子目录。清单生成脚本只扫描目录第一层，不扫描 `branding/` 等子目录。

## 方案二：完整图片直链

也可逐项填写 `url`，它优先于 `file`，不拼接 `basePath`：

```js
wallpapers: [
  { url: 'https://static.example.com/wallpapers/one.webp', title: '风景' }
]
```

示例域名没有提供图片，请替换为自己的实际地址。仅接受 HTTP / HTTPS 图片 URL。原站签名不会被复用；如站点要求签名，使用该站点实际生成的可用直链，并注意过期时间。图片地址及其中的签名会向访问者公开，不应使用敏感凭据。

## 从目录生成文件名清单

Linux：

```sh
python scripts/configure_wallpapers.py /opt/openlist/data/wallpapers
python scripts/build.py
```

Windows PowerShell：

```powershell
python scripts/configure_wallpapers.py 'C:\OpenList\data\wallpapers'
python scripts/build.py
```

可使用 `--base-path` 指定其他 URL 前缀、`--output` 指定配置输出文件。工具只读取文件名，既不复制图片也不改动 OpenList 配置。

## 切换行为

- 页面首次打开或刷新时，从剩余队列选一张；点击“换张壁纸”继续。
- 一轮内逐张播放，下一轮尽量避免与上一张重复。清单变化会重建队列。
- 加载失败时尝试其他图片；全部失败保留旧背景或渐变。按钮会恢复可点击。
- 没有配置图片时显示渐变，并隐藏切换按钮。
- 支持 Web Locks 时，同源标签页协调队列；不支持时仍可切换，但同时操作可能重复。
- 不自动定时轮播，不下载远程图片库，不请求 OpenList 管理 API。
