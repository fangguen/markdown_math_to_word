import React, { useEffect, useState } from 'react'
import katex from 'katex'
import html2canvas from 'html2canvas'

/**
 * MathToImage 组件 - 将数学公式转换为图片
 *
 * 解决浏览器和Word显示尺寸不一致的问题：
 * 1. 自动处理DPI差异（默认96 DPI，适合Word）
 * 2. 使用固定像素字体确保一致性
 * 3. 考虑设备像素比(devicePixelRatio)
 * 4. 支持自定义质量和DPI设置
 *
 * 使用示例：
 * // 基本用法
 * <MathToImage math="E=mc^2" />
 *
 * // 自定义DPI（适合打印）
 * <MathToImage math="E=mc^2" targetDPI={300} />
 *
 * // 高质量输出
 * <MathToImage math="E=mc^2" quality={1.0} />
 */

interface MathToImageProps {
  math: string
  displayMode?: boolean
  className?: string
  parentFontSize?: string // 添加父级字体大小参数
  targetDPI?: number // 目标DPI设置，默认为96（Word标准）
  quality?: number // 图片质量，0-1之间，默认为1.0
}

const MathToImage: React.FC<MathToImageProps> = ({
  math,
  displayMode = false,
  className = '',
  parentFontSize,
  targetDPI = 96,
  quality = 1.0
}) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const convertMathToImage = async () => {
      if (!math.trim()) {
        // Empty math formula, skip conversion
        setIsLoading(false)
        return
      }

        // Converting math to image

      let tempDiv: HTMLDivElement | null = null

      try {
        // 创建临时DOM元素
        tempDiv = document.createElement('div')
        tempDiv.style.position = 'absolute'
        tempDiv.style.left = '-9999px'
        tempDiv.style.top = '-9999px'
        tempDiv.style.fontFamily = 'KaTeX_Main,Times New Roman,serif'
        tempDiv.style.background = 'white'
        tempDiv.style.color = 'black'

          // 计算动态字体大小 - 使用固定像素单位确保Word兼容性
          let baseFontSize: string
          if (parentFontSize) {
            // 如果提供了父级字体大小，基于它计算
            const parentSize = parseFloat(parentFontSize)
            if (displayMode) {
              baseFontSize = `${Math.max(parentSize * 1.1, 18)}px` // 块级公式，设置最小18px
            } else {
              baseFontSize = `${Math.max(parentSize * 1.0, 14)}px` // 行内公式，设置最小14px
            }
          } else {
            // 默认字体大小 - 使用固定像素确保一致性
            if (displayMode) {
              baseFontSize = '20px' // 块级公式固定大小
            } else {
              baseFontSize = '16px' // 行内公式固定大小
            }
          }

          if (displayMode) {
            // 块级公式：居中显示，使用对称padding确保居中
            tempDiv.style.fontSize = baseFontSize
            tempDiv.style.padding = '0.8em 1.0em' // 使用对称的较大padding确保公式居中
            tempDiv.style.textAlign = 'center'
            tempDiv.style.maxWidth = '600px'
            tempDiv.style.margin = '0 auto'
            tempDiv.style.minHeight = '2.5em' // 增加最小高度确保有足够空间
            tempDiv.style.lineHeight = '1.4' // 设置合适的行高
          } else {
            // 行内公式：紧凑设计，使用对称padding
            tempDiv.style.fontSize = baseFontSize
            tempDiv.style.padding = '0.3em 0.5em' // 使用对称的padding确保居中
            tempDiv.style.lineHeight = '1.2' // 稍微增加行高
            tempDiv.style.display = 'inline-block'
            tempDiv.style.minWidth = '1.2em' // 增加最小宽度
            tempDiv.style.minHeight = '1.2em' // 增加最小高度
            tempDiv.style.textAlign = 'center' // 确保行内公式也居中
          }

          document.body.appendChild(tempDiv)

        // 渲染KaTeX到临时元素
        if (tempDiv) {
          katex.render(math, tempDiv, {
            displayMode,
            throwOnError: false,
            output: 'html',
            strict: false
          })
        }

        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 100))

        // 精确调整公式居中位置
        if (tempDiv) {
          // 获取KaTeX公式元素的边界
          const katexElement = tempDiv.querySelector('.katex')
          if (katexElement) {
            const katexRect = katexElement.getBoundingClientRect()
            const containerRect = tempDiv.getBoundingClientRect()

            // 计算公式相对于容器的偏移
            const offsetX = katexRect.left - containerRect.left
            const offsetY = katexRect.top - containerRect.top

            // 如果公式位置不居中，调整容器的padding来补偿
            if (Math.abs(offsetX) > 1 || Math.abs(offsetY) > 1) {
              const currentPadding = tempDiv.style.padding ? tempDiv.style.padding.split(' ') : ['0', '0', '0', '0']
              const paddingTop = parseFloat(currentPadding[0] || '0')
              const paddingRight = parseFloat(currentPadding[1] || currentPadding[0] || '0')
              const paddingBottom = parseFloat(currentPadding[2] || currentPadding[0] || '0')
              const paddingLeft = parseFloat(currentPadding[3] || currentPadding[1] || currentPadding[0] || '0')

              // 调整padding以确保公式居中
              const adjustY = (containerRect.height - katexRect.height) / 2 - offsetY
              const adjustX = (containerRect.width - katexRect.width) / 2 - offsetX

              tempDiv.style.paddingTop = `${Math.max(0, paddingTop + adjustY)}px`
              tempDiv.style.paddingBottom = `${Math.max(0, paddingBottom - adjustY)}px`
              tempDiv.style.paddingLeft = `${Math.max(0, paddingLeft + adjustX)}px`
              tempDiv.style.paddingRight = `${Math.max(0, paddingRight - adjustX)}px`
            }
          }
        }

        // 使用html2canvas转换为图片 - Word兼容性优化
        if (!tempDiv) {
          throw new Error('tempDiv is null')
        }

        // 获取设备像素比，确保在高DPI屏幕上正确渲染
        const devicePixelRatio = window.devicePixelRatio || 1

        // 确保元素有正确的尺寸
        const computedStyle = window.getComputedStyle(tempDiv)
        const actualWidth = Math.max(
          tempDiv.offsetWidth || tempDiv.scrollWidth,
          parseFloat(computedStyle.width) || 0,
          tempDiv.getBoundingClientRect().width || 0
        )
        const actualHeight = Math.max(
          tempDiv.offsetHeight || tempDiv.scrollHeight,
          parseFloat(computedStyle.height) || 0,
          tempDiv.getBoundingClientRect().height || 0
        )

        // 计算目标DPI兼容的尺寸，考虑设备像素比
        const scale = targetDPI / (72 * devicePixelRatio) // html2canvas默认72 DPI

        // 改进的canvas配置，确保内容居中且空白均匀
        const canvas = await html2canvas(tempDiv, {
          background: '#ffffff', // 使用白色背景，Word更兼容
          useCORS: true,
          logging: false,
          allowTaint: true,
          // 精确控制canvas尺寸，确保内容居中
          width: Math.ceil(actualWidth * scale),
          height: Math.ceil(actualHeight * scale),
          // 优化文字渲染
          letterRendering: true
        })

        // 转换为base64图片 - 使用指定的质量参数
        let dataUrl: string
        try {
          // 首先尝试PNG格式（最兼容）
          dataUrl = canvas.toDataURL('image/png', quality)
        } catch (error) {
          console.warn('PNG format failed, trying JPEG:', error)
          // 如果PNG失败，尝试JPEG
          dataUrl = canvas.toDataURL('image/jpeg', Math.max(quality, 0.8))
        }
        setImageDataUrl(dataUrl)
        
        // 清理临时元素
        if (tempDiv && tempDiv.parentNode) {
          document.body.removeChild(tempDiv)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Math to image conversion failed:', error)
        // 确保清理临时元素
        try {
          if (tempDiv && tempDiv.parentNode) {
            document.body.removeChild(tempDiv)
          }
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError)
        }
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    convertMathToImage()
  }, [math, displayMode, targetDPI, quality, parentFontSize])

  if (isLoading) {
    return (
      <span
        className={`math-loading ${className}`}
        style={
          displayMode
            ? {
                display: 'block',
                minHeight: '30px',
                minWidth: '100px',
                backgroundColor: 'rgba(248, 249, 250, 0.8)',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                textAlign: 'center',
                lineHeight: '30px',
                margin: '1em auto',
                fontSize: '0.8em',
                color: '#6c757d'
              }
            : {
                display: 'inline-block',
                minWidth: '15px',
                minHeight: '15px',
                backgroundColor: 'rgba(248, 249, 250, 0.6)',
                border: '1px solid #e9ecef',
                borderRadius: '2px',
                verticalAlign: 'baseline',
                margin: '0 0.05em'
              }
        }
      >
        {displayMode ? '公式加载中...' : '·'}
      </span>
    )
  }

  if (!imageDataUrl) {
    // 如果转换失败，回退到原始KaTeX渲染
    try {
      const html = katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        output: 'html'
      })
      return (
        <span 
          className={`math-fallback ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ display: displayMode ? 'block' : 'inline' }}
        />
      )
    } catch {
      return <span className={className}>{math}</span>
    }
  }

  // 显示提示信息的辅助函数
  const showTooltip = (x: number, y: number, text: string) => {
    const tooltip = document.createElement('div')
    tooltip.textContent = text
    tooltip.style.position = 'fixed'
    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y - 30}px`
    tooltip.style.backgroundColor = '#333'
    tooltip.style.color = 'white'
    tooltip.style.padding = '5px 10px'
    tooltip.style.borderRadius = '4px'
    tooltip.style.fontSize = '12px'
    tooltip.style.zIndex = '10000'
    tooltip.style.pointerEvents = 'none'
    document.body.appendChild(tooltip)

    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip)
      }
    }, 3000)
  }

  return (
    <>
      {/* 显示转换后的图片 */}
      <img
        src={imageDataUrl}
        alt={`数学公式: ${math}`}
        title={`数学公式: ${math}`}
        className={`math-image ${className}`}
        style={
          displayMode
            ? {
                // 块级公式样式
                display: 'block',
                margin: '0.2em auto', // 极小边距，近乎消除Word中的起伏现象
                maxWidth: '95%', // 允许更大的宽度
                height: 'auto',
                textAlign: 'center',
                // Word兼容性优化
                backgroundColor: '#ffffff',
                border: '1px solid transparent',
                // 确保图片清晰
                imageRendering: 'crisp-edges',
                // 添加最小尺寸
                minHeight: '2em'
              }
            : {
                // 行内公式样式 - 优化尺寸和对齐
                display: 'inline-block',
                margin: '0 0.15em', // 稍微增加水平边距
                verticalAlign: 'text-bottom', // 更好的文本对齐
                maxHeight: '1.4em', // 允许更大的高度
                width: 'auto',
                transform: 'translateY(0.03em)', // 微调垂直位置
                // 防止图片变形
                objectFit: 'contain',
                imageRendering: 'crisp-edges',
                // Word兼容性优化
                backgroundColor: '#ffffff',
                // 添加最小尺寸
                minWidth: '1em',
                minHeight: '1em'
              }
        }
        // 添加错误处理，如果图片加载失败则显示文本
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          // 创建一个文本节点来显示公式
          const textNode = document.createElement('span')
          textNode.textContent = math
          textNode.style.fontFamily = 'monospace'
          textNode.style.fontSize = displayMode ? '1.1em' : '0.9em'
          textNode.style.backgroundColor = '#f0f0f0'
          textNode.style.padding = '0.1em 0.2em'
          textNode.style.borderRadius = '2px'
          textNode.title = '图片加载失败，已显示公式文本'
          if (target.parentNode) {
            target.parentNode.insertBefore(textNode, target)
          }
        }}
        // 添加右键菜单功能
        onContextMenu={(e) => {
          e.preventDefault()

          // 创建右键菜单
          const menu = document.createElement('div')
          menu.style.position = 'fixed'
          menu.style.left = `${e.clientX}px`
          menu.style.top = `${e.clientY}px`
          menu.style.backgroundColor = 'white'
          menu.style.border = '1px solid #ccc'
          menu.style.borderRadius = '4px'
          menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
          menu.style.zIndex = '10000'
          menu.style.minWidth = '120px'
          menu.innerHTML = `
            <div style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" class="copy-text">复制公式文本</div>
            <div style="padding: 8px 12px; cursor: pointer;" class="download-image">下载图片文件</div>
          `

          // 复制文本功能
          const copyTextBtn = menu.querySelector('.copy-text')
          if (copyTextBtn) {
            copyTextBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(math).then(() => {
                showTooltip(e.clientX, e.clientY, '公式文本已复制')
              }).catch(() => {
                alert('复制失败，请手动复制公式：' + math)
              })
              document.body.removeChild(menu)
            })
          }

          // 下载图片功能
          const downloadBtn = menu.querySelector('.download-image')
          if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
              const link = document.createElement('a')
              link.href = imageDataUrl
              link.download = `math-formula-${Date.now()}.png`
              link.click()
              showTooltip(e.clientX, e.clientY, '图片已下载')
              document.body.removeChild(menu)
            })
          }

          // 点击其他地方关闭菜单
          const closeMenu = () => {
            if (menu.parentNode) {
              document.body.removeChild(menu)
            }
            document.removeEventListener('click', closeMenu)
          }

          document.addEventListener('click', closeMenu)
          document.body.appendChild(menu)
        }}
      />
    </>
  )
}

export default MathToImage
