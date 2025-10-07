import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Force IPv4
    port: 5173
  },
  build: {
    // 增加chunk大小限制到1MB，避免警告
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手动分块优化
        manualChunks: {
          // React相关库
          'react-vendor': ['react', 'react-dom'],
          // Markdown处理库
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'remark-math'],
          // 数学公式库
          'math-vendor': ['katex', 'rehype-katex'],
          // 代码高亮库
          'highlight-vendor': ['rehype-highlight', 'highlight.js'],
          // 图片处理库
          'image-vendor': ['html2canvas']
        },
        // 优化chunk命名
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 启用代码分割
    cssCodeSplit: true,
    // 优化依赖预构建
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
})
