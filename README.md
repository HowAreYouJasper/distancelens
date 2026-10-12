# DistanceLens · 距离约束定位

一个在浏览器中运行的多边定位工具。只保留自己的或已获授权的数据输入，支持高德地点搜索、选择参考地址、距离圆环与候选区域可视化。MIT 开源，无构建或依赖安装步骤。

## 运行

需要 Node.js 22 或更高版本：

```sh
npm start
```

访问 http://127.0.0.1:4173 。没有高德 Key 时仍可手动输入坐标并使用几何视图。离线几何计算也可以直接打开 dist/index.html；高德接入建议使用 HTTP 服务和正确的域名白名单。

验证算法和高德适配器：

```sh
npm test
```

## 高德 API 接入

1. 在[高德开放平台](https://console.amap.com/dev/key/app)创建应用，申请 Web 端（JS API）Key 和 securityJsCode，不是 Web 服务 Key。
2. 在页面“高德地图连接”填写 Key 和安全密钥，点击连接。密钥仅保留在当前页面运行内存，不写入项目文件、localStorage 或导出结果。
3. 选择城市，搜索地点名称或地址，从候选列表中选中正确地点。
4. 坐标自动填入，填写目标到该点的直线距离和允许误差，点击添加参考点。
5. 至少三个参考点后点击计算，查看高德地图或几何视图上的圆环、候选区域和估算点。

申请于 2021 年 12 月 2 日之后的 Key 需要配合安全密钥，具体设置以[高德官方文档](https://developer.amap.com/api/javascript-api-v2/guide/abc/jscode)为准。Key 的域名白名单、服务权限和配额由你的高德账户管理，项目不自带任何有效密钥。

### 正式部署的安全代理

页面同时支持 serviceHost。正式上线建议使用服务器代理，避免把 securityJsCode 暴露在浏览器中。填写完整地址，如 https://your-domain.example/_AMapService，此时不需要在页面填写 securityJsCode。高德官方提供 Nginx 代理配置示例，见上述文档。代理服务器及证书需要自行部署，本仓库不包含公共代理或预配置服务端密钥。

[搜索功能依据官方 PlaceSearch 文档](https://developer.amap.com/api/javascript-api-v2/guide/services/autocomplete)，使用 JS API 2.0。Key 只在点击连接后向高德加载 SDK 时使用。连接成功只代表 SDK 已加载，搜索调用会进一步校验 API 权限；无结果、认证错误和超时均显示提示。

## 坐标与数据输入

高德搜索与地图使用 GCJ-02。手动输入 GPS 数据时选择 WGS84，此时仅使用几何视图，不将 WGS84 坐标直接叠加到高德地图。添加点后锁定坐标系，清空点后才能切换。不进行隐式坐标系转换。

支持 3 至 8 个参考点；每个参考点都有独立距离与误差，可以编辑距离、误差或移除地点。批量输入每行填写：

```
纬度,经度,直线距离（米）,允许误差（米，可选，默认35）
```

批量输入会替换现有参考点。全部点必须使用页面所选坐标系，距离不能是步行或驾车路线长度。纬度范围 ±80°，参考点间距和观测距离不超过 10 km，误差范围 1 至 500 m。

## 数据与隐私

用于本人或经本人授权的数据分析，请勿用于未经同意的第三方位置追踪。项目不识别截图，不请求设备定位，不采集第三方用户信息。

未连接高德时不发起外部请求。接入高德后，SDK、地图瓦片、地图视野和地址搜索由高德服务处理，浏览器会发出相关网络请求。距离数据和数值求解留在本地，但高德 SDK 作为页面内第三方脚本具有访问页面的能力，不应将其描述为严格隔离的私密执行环境。用户点击导出后，JSON 包含输入地点、距离与计算结果，请自行保管。输入不持久保存，刷新会清空；项目自身不使用 localStorage 或 cookies，第三方 SDK 的行为以高德政策为准。

## 数学方法与局限

参考点为 aᵢ，观测距离为 dᵢ，允许误差为 εᵢ。可行点 p 满足：

```
|‖p − aᵢ‖ − dᵢ| ≤ εᵢ    对所有 i
```

圆环交集表示共同满足约束的点。估算点最小化 Σ(‖p − aᵢ‖ − dᵢ)²，使用 25 个初始点的阻尼 Gauss–Newton 与回溯步长，不保证全局最优。误差影响可行区域，不作为最小二乘权重。共线参考点可能产生多个镜像解，估算标记只展示一个数值解。

输入坐标通过以平均纬度和首个参考点经度为基准的球面局部投影换算为米，球半径 6371008.8 m。不是椭球精确测地计算，GCJ-02 本身也具有空间偏移与局部畸变，适合小范围探索，不适用于高精度测绘。六位小数只是显示格式，不是精度承诺。

可行区域使用 240 × 240 网格，视窗根据距离和参考点范围自动设置，面积为近似值。窄小交集可能漏检，“未检出”不等于严格证明无解。候选区域不是概率置信区间，估算点可能位于候选区域之外。

高德上的距离中心圆由 AMap.Circle 绘制，圆环与候选区使用局部投影计算的 Polygon 近似表示。候选采样格按横向连续区段合并，减少叠加对象数量，保留分离候选区域。

## 项目结构

```
dist/index.html          页面结构与输入表单
dist/style.css           响应式样式
dist/app.js              输入、计算、搜索与导出交互
dist/solver.js           投影、数值求解与区域采样
dist/amap-adapter.js     高德 SDK 加载、搜索与地图叠加
tests/                  算法与适配器单元测试
server.cjs              本地静态服务器
.github/workflows/      GitHub Pages 自动测试与部署
```

适配器单元测试使用 SDK 替身，不能替代真实 Key、搜索权限、实际地图渲染与网络环境的联调。

## 发布到 GitHub

解压源码包，新建空 GitHub 仓库。在解压目录执行，将 YOUR_NAME 替换为你的用户名：

```sh
git init
git add .
git commit -m "Initial DistanceLens AMap positioning tool"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/distancelens.git
git push -u origin main
```

如已有 origin，请另选远程名称或按需调整。不要把 Key 或安全密钥提交到仓库。仓库已包含 GitHub Pages 工作流，在 Settings → Pages 中选择 GitHub Actions。推送 main 分支后部署 dist/。高德 Key 的域名白名单需允许实际 Pages 域名。

## License

MIT。欢迎通过 Issues 和 Pull Requests 贡献改进。
