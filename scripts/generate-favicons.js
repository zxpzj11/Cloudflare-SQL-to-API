/**
 * 从SVG源文件生成favicon所需的所有格式文件
 *
 * 使用方法:
 * 1. 安装依赖: npm install sharp
 * 2. 运行脚本: node scripts/generate-favicons.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../public");

async function generatePngFromSvg(svgPath, outputPath, size) {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(svgPath)) {
      console.error(`SVG文件不存在: ${svgPath}`);
      return;
    }

    const svgBuffer = fs.readFileSync(svgPath);

    // 使用sharp直接将SVG转换为PNG
    await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`处理 ${svgPath} 时出错:`, error);
  }
}

async function generateIcoFile(pngPath, outputPath, size = 32) {
  try {
    if (!fs.existsSync(pngPath)) {
      console.error(`PNG文件不存在: ${pngPath}`);
      return;
    }

    // 直接将PNG作为ICO输出
    // 注意：这只是一种临时方案，真正的ICO文件应包含多个尺寸
    await sharp(pngPath).resize(size, size).toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
  } catch (error) {
    console.error(`生成ICO文件时出错:`, error);
  }
}

async function generateAllFavicons() {
  try {
    // 生成各种尺寸的PNG
    await generatePngFromSvg(
      path.join(PUBLIC_DIR, "favicon-16x16.svg"),
      path.join(PUBLIC_DIR, "favicon-16x16.png"),
      16
    );

    await generatePngFromSvg(
      path.join(PUBLIC_DIR, "favicon-32x32.svg"),
      path.join(PUBLIC_DIR, "favicon-32x32.png"),
      32
    );

    await generatePngFromSvg(
      path.join(PUBLIC_DIR, "favicon.svg"),
      path.join(PUBLIC_DIR, "favicon-64x64.png"),
      64
    );

    await generatePngFromSvg(
      path.join(PUBLIC_DIR, "apple-touch-icon.svg"),
      path.join(PUBLIC_DIR, "apple-touch-icon.png"),
      180
    );

    // 使用32x32的PNG作为ICO文件
    // 注意：这是简化处理，真正的ICO应包含多尺寸
    await generateIcoFile(
      path.join(PUBLIC_DIR, "favicon-32x32.png"),
      path.join(PUBLIC_DIR, "favicon.ico"),
      32
    );

    console.log("所有图标文件生成完成!");
  } catch (error) {
    console.error("生成图标时出错:", error);
  }
}

// 执行主函数
generateAllFavicons();
