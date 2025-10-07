import React, { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import MathToImage from './MathToImage'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'
import './App.css'

const defaultMarkdown = `# Markdown转Word工具

## 功能特点

这是一个**强大**的markdown转word工具，支持：

1. **实时预览** - 左侧编辑，右侧即时预览
2. **数学公式** - 支持LaTeX数学公式渲染
3. **代码高亮** - 支持多种编程语言语法高亮
4. **丰富格式** - 支持表格、列表、链接等

## 数学公式示例

行内公式：$E = mc^2$

块级公式：
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## 向量数学示例

在长方体 $ABCD-A_1B_1C_1D_1$ 中，设 $\\overrightarrow{AB} = \\vec{a}$, $\\overrightarrow{AD} = \\vec{b}$, $\\overrightarrow{AA_1} = \\vec{c}$。

用基底 $\\{\\vec{a}, \\vec{b}, \\vec{c}\\}$ 表示 $\\overrightarrow{AC_1}$ 和 $\\overrightarrow{BD_1}$：

$$\\overrightarrow{AC_1} = \\overrightarrow{AB} + \\overrightarrow{BC} + \\overrightarrow{CC_1} = \\vec{a} + \\vec{b} + \\vec{c}$$

$$\\overrightarrow{BD_1} = \\overrightarrow{BA} + \\overrightarrow{AD} + \\overrightarrow{DD_1} = -\\vec{a} + \\vec{b} + \\vec{c}$$

**解题心法**: 路径分解法 - 利用空间几何体的棱，通过向量加减法的几何意义（首尾相接），将目标向量分解为基底向量的线性组合。

## 代码示例

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

## 表格示例

| 功能 | 支持状态 | 说明 |
|------|----------|------|
| 标题 | ✅ | 支持1-6级标题 |
| 列表 | ✅ | 有序/无序列表 |
| 表格 | ✅ | 支持表格格式 |
| 图片 | ✅ | 支持图片显示 |

---

**使用说明：**
1. 在左侧编辑器中粘贴或编辑你的markdown内容
2. 右侧会实时预览渲染效果（数学公式自动转换为图片）
3. 满意后点击"复制内容"按钮复制到剪贴板
4. 然后可以粘贴到Word或其他文档编辑器中

*开始编辑吧！*`

function App() {
  const [markdown, setMarkdown] = useState(defaultMarkdown)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    if (previewRef.current) {
      try {
        // 等待所有数学公式图片生成完成
        const mathImages = previewRef.current.querySelectorAll('.math-image')
        if (mathImages.length > 0) {
          // 检查是否有图片还在加载中
          const loadingImages = Array.from(mathImages)
            .filter((img): img is HTMLImageElement => img instanceof HTMLImageElement)
            .filter(img =>
              !img.src.startsWith('data:image') ||
              img.naturalWidth === 0
            )

          if (loadingImages.length > 0) {
            alert('正在生成数学公式图片，请稍后再试...')
            return
          }
        }

        // 1. 克隆预览节点以进行无损操作
        const clonedPreview = previewRef.current.cloneNode(true) as HTMLDivElement

        // 2. 遍历代码块，从原始DOM计算样式并应用到克隆DOM，同时修复换行
        const originalPres = previewRef.current.querySelectorAll('pre')
        const clonedPres = clonedPreview.querySelectorAll('pre')

        originalPres.forEach((originalPre, index) => {
          const clonedPre = clonedPres[index]
          if (!clonedPre) return

          // --- Step A: 内联 <pre> 容器的样式 ---
          const preStyle = window.getComputedStyle(originalPre)
          clonedPre.style.backgroundColor = preStyle.backgroundColor
          clonedPre.style.padding = '12px 16px' // 使用固定值避免计算差异
          clonedPre.style.margin = '16px 0'
          clonedPre.style.border = '1px solid #e9ecef'
          clonedPre.style.borderRadius = '6px'
          clonedPre.style.fontFamily = "Consolas, 'Courier New', Monaco, monospace"
          clonedPre.style.fontSize = '14px'
          clonedPre.style.lineHeight = '1.5'
          clonedPre.style.whiteSpace = 'pre-wrap' // 确保长代码在Word中能换行
          clonedPre.style.wordWrap = 'break-word'
          clonedPre.style.overflowX = 'auto'

          // --- Step B: 内联代码高亮 (<span>) 的颜色 ---
          const originalSpans = originalPre.querySelectorAll('span[class^="hljs-"]')
          const clonedSpans = clonedPre.querySelectorAll('span[class^="hljs-"]')

          originalSpans.forEach((originalSpan, spanIndex) => {
            const clonedSpan = clonedSpans[spanIndex] as HTMLElement
            if (clonedSpan) {
              const spanStyle = window.getComputedStyle(originalSpan)
              clonedSpan.style.color = spanStyle.color
              clonedSpan.removeAttribute('class') // 清理class，避免Word样式冲突
            }
          })

          // --- Step C: 修复Word中的换行问题 ---
          const codeElement = clonedPre.querySelector('code')
          if (codeElement) {
            // 将换行符 \n 替换为 <br> 标签
            codeElement.innerHTML = codeElement.innerHTML.replace(/\n/g, '<br>')
          }
        })

        // 获取处理后的HTML内容
        let htmlContent = clonedPreview.innerHTML

        // 为整个内容添加Word兼容的基础样式
        htmlContent = `<div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: #1f2937;
          max-width: none;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
          word-wrap: break-word;
          mso-line-height-rule: exactly;
          mso-text-raise: 0;
        ">${htmlContent}</div>`

        // 旧的清理代码块的逻辑现在可以被移除或注释掉
        /*
        // 处理语法高亮的代码块 - 彻底清理并重新格式化
        // 首先清理所有语法高亮的span标签，只保留纯文本
        htmlContent = htmlContent.replace(
          /<pre([^>]*)><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
          (_, preAttrs, __, content) => {
            // 提取纯文本内容，移除所有HTML标签
            const cleanText = content
              .replace(/<[^>]*>/g, '') // 移除所有HTML标签
              .replace(/&lt;/g, '<')   // 解码HTML实体
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#x27;/g, "'")
              .trim()
            
            // 返回清理后的代码块，使用我们自定义的样式
            return `<pre${preAttrs} style="` +
              'background-color: #f8f9fa; ' +
              'border: 2px solid #e9ecef; ' +
              'border-radius: 6px; ' +
              'padding: 12px 16px; ' +
              'margin: 16px 0; ' +
              'font-family: Consolas, \'Courier New\', Monaco, monospace; ' +
              'font-size: 12px; ' +
              'font-weight: normal; ' +
              'line-height: 1.5; ' +
              'color: #212529; ' +
              'page-break-inside: avoid; ' +
              'word-wrap: break-word; ' +
              'white-space: pre-wrap; ' +
              'display: block; ' +
              'clear: both; ' +
              'overflow-x: auto; ' +
              'tab-size: 4; ' +
              'mso-element: para; ' +
              'mso-margin-top-alt: auto; ' +
              'mso-margin-bottom-alt: auto;' +
              '"><code style="' +
              'font-family: inherit; ' +
              'font-size: inherit; ' +
              'color: inherit; ' +
              'background: transparent; ' +
              'padding: 0; ' +
              'margin: 0; ' +
              'border: none;' +
              '">' + cleanText + '</code></pre>'
          }
        )
        */

        // 处理剩余的行内代码 <code> 标签（代码块已经处理完毕）
        htmlContent = htmlContent.replace(
          /<code([^>]*)>/g,
          '<code$1 style="' +
          'background-color: #f1f3f4; ' +
          'color: #c7254e; ' +
          'padding: 2px 6px; ' +
          'margin: 0 2px; ' +
          'font-family: Consolas, \'Courier New\', Monaco, monospace; ' +
          'font-size: 90%; ' +
          'font-weight: normal; ' +
          'border: 1px solid #d1d5db; ' +
          'border-radius: 3px; ' +
          'word-wrap: break-word; ' +
          'white-space: nowrap; ' +
          'vertical-align: baseline; ' +
          'mso-element: span;' +
          '">'
        )

        // 为表格添加Word兼容的样式
        htmlContent = htmlContent.replace(
          /<table([^>]*)>/g,
          '<table$1 style="' +
          'border-collapse: collapse; ' +
          'width: 100%; ' +
          'margin: 16px 0; ' +
          'font-size: 14px; ' +
          'mso-table-lspace: 0pt; ' +
          'mso-table-rspace: 0pt; ' +
          'mso-table-anchor-vertical: paragraph; ' +
          'mso-table-anchor-horizontal: margin;' +
          '">'
        )

        // 为表头单元格添加样式
        htmlContent = htmlContent.replace(
          /<th([^>]*)>/g,
          '<th$1 style="' +
          'border: 1px solid #d0d7de; ' +
          'padding: 8px 12px; ' +
          'background-color: #f6f8fa; ' +
          'font-weight: 600; ' +
          'text-align: left; ' +
          'vertical-align: top; ' +
          'mso-element: th;' +
          '">'
        )

        // 为表格单元格添加样式
        htmlContent = htmlContent.replace(
          /<td([^>]*)>/g,
          '<td$1 style="' +
          'border: 1px solid #d0d7de; ' +
          'padding: 8px 12px; ' +
          'vertical-align: top; ' +
          'mso-element: td;' +
          '">'
        )

        // 为引用块添加样式
        htmlContent = htmlContent.replace(
          /<blockquote([^>]*)>/g,
          '<blockquote$1 style="' +
          'margin: 16px 0; ' +
          'padding: 0 16px; ' +
          'border-left: 4px solid #d1d5db; ' +
          'background-color: #f9fafb; ' +
          'font-style: italic; ' +
          'color: #6b7280; ' +
          'page-break-inside: avoid;' +
          '">'
        )

        // 为标题添加Word兼容的样式
        for (let i = 1; i <= 6; i++) {
          const fontSize = Math.max(24 - i * 2, 14) // h1=22px, h2=20px, ..., h6=14px
          htmlContent = htmlContent.replace(
            new RegExp(`<h${i}([^>]*)>`, 'g'),
            `<h${i}$1 style="` +
            `font-size: ${fontSize}px; ` +
            `font-weight: bold; ` +
            `margin: ${i === 1 ? '24px' : '20px'} 0 16px 0; ` +
            `color: #1f2937; ` +
            `line-height: 1.25; ` +
            `page-break-after: avoid; ` +
            `mso-element: h${i};` +
            `">`
          )
        }

        // 检查是否支持现代Clipboard API
        if (navigator.clipboard && window.ClipboardItem) {
          // 使用现代Clipboard API
          const blob = new Blob([htmlContent], { type: 'text/html' })
          const data = [new ClipboardItem({ 'text/html': blob })]

          await navigator.clipboard.write(data)
          alert('内容已复制到剪贴板！可以粘贴到Word等应用中。')
        } else {
          // 回退到传统方法
          const range = document.createRange()
          range.selectNode(previewRef.current)
          const selection = window.getSelection()

          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)

            // 使用传统方法
            const success = document.execCommand('copy')
            selection.removeAllRanges()

            if (success) {
              alert('内容已复制到剪贴板！可以粘贴到Word等应用中。')
            } else {
              throw new Error('传统复制方法失败')
            }
          }
        }
      } catch (err) {
        console.error('复制失败:', err)

        // 提供手动复制的指导
        alert('自动复制失败。请手动选择右侧预览区域的内容（Ctrl+A），然后复制（Ctrl+C）到Word中。')

        // 自动选择内容供用户手动复制
        if (previewRef.current) {
          const range = document.createRange()
          range.selectNodeContents(previewRef.current)
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      }
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📝 Markdown转Word工具</h1>
        <p>实时预览 | 数学公式 | 格式丰富</p>
      </header>
      
      <div className="container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>📝 Markdown编辑器</h3>
            <span className="char-count">{markdown.length} 字符</span>
          </div>
          <textarea
            value={markdown}
            onChange={handleTextareaChange}
            placeholder="在这里粘贴或编辑你的markdown内容..."
            className="editor"
          />
        </div>
        
        <div className="preview-panel">
          <div className="panel-header">
            <h3>👁️ 实时预览</h3>
            <button onClick={handleCopy} className="copy-button">
              📋 复制内容
            </button>
          </div>
          <div 
            ref={previewRef}
            className="preview"
          >
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeHighlight]}
              components={{
                // 处理行内数学公式 (remark-math创建的inlineMath节点)
                span: ({ children, className, ...props }: React.HTMLProps<HTMLSpanElement>) => {
                  // 检查是否是数学公式
                  const classNames = className ? className.split(' ') : []
                  if (classNames.includes('math-inline')) {
                    const mathContent = typeof children === 'string' ? children : String(children)
                    return <MathToImage math={mathContent} displayMode={false} parentFontSize="16px" />
                  }
                  return <span className={className} {...props}>{children}</span>
                },
                
                // 处理块级数学公式 (remark-math创建的math节点)
                div: ({ children, className, ...props }: React.HTMLProps<HTMLDivElement>) => {
                  // 检查是否是块级数学公式
                  const classNames = className ? className.split(' ') : []
                  if (classNames.includes('math-display')) {
                    const mathContent = typeof children === 'string' ? children : String(children)
                    return <MathToImage math={mathContent} displayMode={true} parentFontSize="16px" />
                  }
                  return <div className={className} {...props}>{children}</div>
                },

                // 数学公式处理已经通过span和div组件完成

                // 处理被误识别为代码的数学公式
                code: ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
                  const classNames = className ? className.split(' ') : []
                  const codeText = String(children).replace(/\n$/, '')
                  
                  // 检查是否是数学代码
                  if (classNames.includes('language-math')) {
                    if (classNames.includes('math-inline')) {
                      return <MathToImage math={codeText} displayMode={false} parentFontSize="16px" />
                    }
                    if (classNames.includes('math-display')) {
                      return <MathToImage math={codeText} displayMode={true} parentFontSize="16px" />
                    }
                  }
                  
                  // 正常的代码渲染
                  return <code className={className} {...props}>{children}</code>
                },

                // 处理被误识别为pre>code的数学公式
                pre: ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => {
                  // 检查子元素是否是数学代码
                  if (React.isValidElement(children) && (children.props as any)?.className?.includes('language-math')) {
                    const mathContent = String((children.props as any).children).replace(/\n$/, '')
                    return <MathToImage math={mathContent} displayMode={true} parentFontSize="16px" />
                  }
                  
                  // 正常的代码块渲染
                  return <pre {...props}>{children}</pre>
                },

                // 自定义组件渲染
                img: ({ src, alt, ...props }) => (
                  <img 
                    src={src} 
                    alt={alt} 
                    {...props}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ),
                // 表格样式优化
                table: ({ children, ...props }) => (
                  <table {...props} style={{ 
                    borderCollapse: 'collapse', 
                    width: '100%', 
                    marginBottom: '1rem' 
                  }}>
                    {children}
                  </table>
                ),
                th: ({ children, ...props }) => (
                  <th {...props} style={{ 
                    border: '1px solid #ddd', 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5',
                    textAlign: 'left'
                  }}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td {...props} style={{ 
                    border: '1px solid #ddd', 
                    padding: '8px' 
                  }}>
                    {children}
                  </td>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App