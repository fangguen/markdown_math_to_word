import React from 'react'
import MathToImage from './MathToImage'

const Demo: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>数学公式图片尺寸测试</h1>

      <h2>问题说明</h2>
      <p>
        修复前：在浏览器中渲染正常的数学公式，复制到Word中会变得异常大。<br/>
        修复后：通过考虑DPI差异和设备像素比，确保在Word中显示正确尺寸。
      </p>

      <h2>测试用例</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>1. 默认设置 (96 DPI)</h3>
        <p>行内公式: <MathToImage math="E=mc^2" /></p>
        <p>块级公式:</p>
        <MathToImage math="\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}" displayMode={true} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>2. 高DPI设置 (适合打印)</h3>
        <p>行内公式: <MathToImage math="E=mc^2" targetDPI={300} /></p>
        <p>块级公式:</p>
        <MathToImage math="\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}" displayMode={true} targetDPI={300} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>3. 自定义质量设置</h3>
        <p>高质量: <MathToImage math="E=mc^2" quality={1.0} /></p>
        <p>中等质量: <MathToImage math="E=mc^2" quality={0.8} /></p>
      </div>

      <h2>使用方法</h2>
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`// 基本用法
<MathToImage math="E=mc^2" />

// 自定义DPI（适合打印）
<MathToImage math="E=mc^2" targetDPI={300} />

// 高质量输出
<MathToImage math="E=mc^2" quality={1.0} />

// 块级公式
<MathToImage math="\\int x^2 dx" displayMode={true} />`}
      </pre>

      <h2>技术说明</h2>
      <ul>
        <li><strong>DPI处理</strong>: 自动计算缩放比例，确保Word中显示正确尺寸</li>
        <li><strong>设备像素比</strong>: 考虑高DPI屏幕的显示差异</li>
        <li><strong>固定字体</strong>: 使用像素单位替代相对单位，确保一致性</li>
        <li><strong>质量控制</strong>: 支持自定义图片质量参数</li>
      </ul>
    </div>
  )
}

export default Demo

