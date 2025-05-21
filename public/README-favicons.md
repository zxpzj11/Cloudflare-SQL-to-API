# Favicon 图标生成说明

## 文件说明

本目录包含了以下 SVG 源文件，用于生成网站的各种图标：

- `favicon.svg` - 主图标，64x64 像素
- `favicon-16x16.svg` - 16x16 像素图标
- `favicon-32x32.svg` - 32x32 像素图标
- `apple-touch-icon.svg` - 苹果设备 TouchIcon, 180x180 像素
- `safari-pinned-tab.svg` - Safari 固定标签图标

## 生成图标文件

要从 SVG 文件生成实际的 PNG 和 ICO 文件，可以使用以下方法：

### 方法 1: 使用提供的脚本

1. 安装必要的依赖:

   ```bash
   npm install sharp
   ```

2. 运行生成脚本:

   ```bash
   node scripts/generate-favicons.js
   ```

   注意：该脚本使用 ES 模块语法编写，与项目的 `"type": "module"` 设置兼容。当前脚本使用 Sharp 库将 SVG 转换为 PNG 和 ICO 格式。

### 方法 2: 使用在线转换工具

如果您在运行脚本时遇到问题，可以使用以下在线工具：

1. [realfavicongenerator.net](https://realfavicongenerator.net) - 上传 SVG 文件并生成所有图标格式
2. [favicon.io](https://favicon.io/favicon-converter/) - 支持 SVG 到各种 favicon 格式的转换

### 方法 3: 手动转换

如果您喜欢手动操作，可以使用以下工具：

1. 使用 Inkscape 等矢量绘图软件打开 SVG 文件
2. 导出为所需尺寸的 PNG 文件:
   - 16x16 像素
   - 32x32 像素
   - 64x64 像素
   - 180x180 像素 (Apple Touch Icon)
3. 使用图像编辑软件将这些 PNG 合并为 .ico 文件，或使用在线工具

## 图标使用

项目配置已更新，将使用以下文件：

- `favicon.ico` - 主图标文件
- `favicon-16x16.png` - 小尺寸图标
- `favicon-32x32.png` - 中尺寸图标
- `apple-touch-icon.png` - 苹果设备图标
- `safari-pinned-tab.svg` - Safari 固定标签图标

## 设计说明

这些图标设计体现了"SQL to API"项目的核心功能：将 SQL 查询转化为 API 端点。图标采用了简约的设计风格，使用数据库符号和转换箭头的组合来表达这一概念。

主色调使用#409EFF，与 Element Plus 组件库的默认主题色保持一致。
