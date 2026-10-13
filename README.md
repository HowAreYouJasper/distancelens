<div align="center">
  <img src="docs/assets/logo.svg" width="96" alt="DistanceLens 项目标识">
  <h1>DistanceLens · 三点定位</h1>
  <p>输入三个地点和距离，找出可能的位置。</p>
  <p><strong>简体中文</strong> | <a href="README.en.md">English</a></p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-64765a" alt="MIT 许可证"></a>
    <a href="package.json"><img src="https://img.shields.io/badge/version-0.3.0-52676b" alt="版本 0.3.0"></a>
    <img src="https://img.shields.io/badge/Node.js-22%2B-64765a" alt="Node.js 22 或以上">
    <a href="https://github.com/HowAreYouJasper/distancelens/stargazers"><img src="https://img.shields.io/github/stars/HowAreYouJasper/distancelens?style=flat&color=52676b" alt="GitHub Stars"></a>
  </p>
  <p><a href="https://howareyoujasper.github.io/distancelens/">在线演示</a> · <a href="#怎么使用">使用方法</a> · <a href="#高德-api-接入">高德接入</a> · <a href="https://github.com/HowAreYouJasper/distancelens/issues">问题反馈</a></p>
</div>

## 这是做什么的？

**知道目标离三个已知地点分别有多远，就可以尝试找出目标的位置。** DistanceLens 把这个过程画出来，让你直接看到圆和可能的范围。

比如，你知道目标离地点 A、B、C 的直线距离，就分别以这三个地点为圆心、距离为半径画圆。理想情况下，三个圆周的共同交点就是目标的位置。这种方法可以通俗地叫作“三点定位”。

实际距离往往有误差，所以应用会给每个圆加上一圈宽度。**三圈圆环共同重叠的地方，是可能的位置范围。** 数据不准确或地点排列不合适时，可能找不到重叠范围，也可能出现多个范围。结果是估算，不代表确定位置。

本项目只使用**自己的或已获授权的数据**。支持输入 3 至 8 个地点，也可以接入高德地图搜索地址。

## 项目展示

[打开在线演示](https://howareyoujasper.github.io/distancelens/)

![三点定位原理示意](docs/assets/overview.svg)

上图是原理示意，不是真实地图或实测结果。

![DistanceLens 三点定位页面](docs/assets/preview.jpg)

截图使用虚构地点和距离演示，未接入真实高德 Key。打开应用后，需要自行输入数据。

## 怎么使用

1. **选地点**：手动填写经纬度，或者连接高德后搜索并选择地址。
2. **填距离**：填写目标到每个地点的直线距离，单位是米，再填写距离可能相差多少米。
3. **看范围**：添加至少三个地点，点击“找出可能的位置”。查看圆环、绿色范围和十字标记。

颜色对应不同地点。**绿色范围**是目前找到的、符合全部距离误差的地方。**十字标记**是尽量贴近所有输入距离的估算位置，不一定落在绿色范围内。

页面上的“距离偏差”越小，说明估算位置越贴近输入的距离。“可能范围约面积”帮助你了解范围大小，两项都不能保证实际定位精度。

## 可以做什么

- **搜索地址**：接入高德后，选择地点即可自动填入经纬度。
- **手动填数据**：不配置高德也能画圆、计算范围。
- **添加更多地点**：支持 3 至 8 个地点，每个地点单独填写距离和误差。
- **随时修改**：调整距离和误差，删除地点，重新计算。
- **批量输入**：一次输入多行坐标和距离。
- **导出结果**：保存为 JSON 文件，包含输入数据和计算结果。
- **手机也能用**：页面适配窄屏，不申请设备定位权限。

## 本地运行

安装 Node.js 22 或更高版本，然后运行：

```sh
git clone https://github.com/HowAreYouJasper/distancelens.git
cd distancelens
npm start
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。不需要安装额外依赖。没有高德 Key，也能手动输入数据。

只使用离线画圆功能时，也可以直接打开 `dist/index.html`。使用高德建议通过上面的本地服务打开。

## 高德 API 接入

1. 登录[高德开放平台](https://console.amap.com/dev/key/app)，创建一个应用。
2. 申请 **Web 端（JS API）** 类型的 Key，取得安全密钥 `securityJsCode`。注意不要选成“Web 服务”类型。
3. 在页面的“高德地图连接”中填入 Key 和安全密钥，点击“连接高德地图”。
4. 输入城市和地点名称，点击搜索，从列表中选中正确的地址。
5. 填写距离，添加至少三个地点后计算。

项目不附带可用 Key。域名白名单、搜索权限和配额需要在自己的高德账户中设置。Key 和安全密钥不会写入项目文件或导出结果，刷新页面后需要重新填写。

<details>
<summary>正式上线时如何配置安全代理</summary>

正式部署建议通过服务器代理保管安全密钥。页面支持 `serviceHost`，例如 `https://your-domain.example/_AMapService`。配置代理时，不需要在页面填写安全密钥。代理服务器需要自行部署。

配置方式见[高德安全密钥文档](https://developer.amap.com/api/javascript-api-v2/guide/abc/jscode)。地点搜索使用[高德 PlaceSearch](https://developer.amap.com/api/javascript-api-v2/guide/services/autocomplete)。地图连接成功后，搜索是否可用还取决于 Key 的服务权限。

</details>

## 填数据时注意什么

- **填直线距离**，不要填步行或驾车路线的长度。
- **不要混用坐标**。高德搜索使用 GCJ-02；手动输入 GPS 经纬度时选择 WGS84，只在画圆视图查看。已有地点时不能切换，清空后可以重新选择。
- **误差要贴近实际**。例如允许误差填 35，表示距离可能比填写值少 35 米或多 35 米。误差设得太小，圆环可能无法重叠。
- **适合小范围使用**。地点之间的间距和输入距离不超过 10 千米，允许误差为 1 至 500 米。
- **地点尽量分散**。三个地点排在同一直线上，可能算出两个对称的位置。

批量输入时，每行一个地点，不写表头：

```text
纬度,经度,直线距离（米）,允许误差（米）
```

最后的误差可以省略，默认 35 米。一次输入 3 至 8 行，会替换现有地点。

## 结果能有多准？

准确程度取决于地点坐标、距离和误差。显示很多位小数，不代表定位也有那么精确。

绿色范围通过网格近似计算，很窄的重叠部分可能没有显示出来。因此，“未找到共同范围”不能证明一定不存在交点。估算位置也不是实际测量结果，适合学习原理和分析已授权的数据。

<details>
<summary>给开发者：计算方式</summary>

原理是基于距离的定位，三个地点时称为三边定位（trilateration），更多地点时称为多边定位（multilateration），不使用角度测量。

每个圆环包含“到该地点的距离与输入值之差不超过允许误差”的点。估算位置使用 25 个初始点的非线性最小二乘求解，采用阻尼 Gauss–Newton 与回溯步长，不保证全局最优。允许误差影响绿色范围，不作为拟合权重。

经纬度通过局部球面投影换算为米，球半径为 6,371,008.8 米。绿色范围使用 240 × 240 网格，面积是近似值，不是统计置信区间。投影与 GCJ-02 畸变会影响结果，不适用于高精度测绘。

</details>

## 数据与隐私

仅使用自己的或已获授权的数据，请勿用于未经同意的第三方位置追踪。应用不读取截图，不获取设备定位，不自动收集个人位置。

距离计算在浏览器中完成，输入不会由应用持久保存，刷新后清空。接入高德后，地址搜索、地图加载等会向高德发送请求，高德 SDK 作为页面内第三方脚本也有访问页面的能力。导出的 JSON 包含地点与距离，请自行保管。

## 技术与目录

页面使用 HTML、CSS 和原生 JavaScript，画圆使用 Canvas，高德提供地图和地址搜索。本地服务与测试使用 Node.js。

```text
dist/                   页面、交互、计算与高德接入
docs/assets/            标识、原理图与截图
tests/                  算法与高德适配器测试
server.cjs              本地静态服务器
.github/workflows/      GitHub Pages 自动测试与部署
README.en.md            英文说明
```

## 部署与贡献

将 `dist/` 上传到静态托管服务即可运行。GitHub Pages 在 Settings → Pages 中选择 GitHub Actions，推送 main 分支后会自动测试与部署。使用高德时，需要在 Key 白名单中允许实际网站域名。

欢迎提交 Issues 和 Pull Requests。修改代码后运行 `npm test`。高德适配器测试使用模拟 SDK，不能替代真实 Key 的联调。请勿提交密钥或个人位置数据。

## 许可证

[MIT](LICENSE)，可自由使用和修改，按许可证要求保留声明。
