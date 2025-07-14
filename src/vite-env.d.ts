/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  // 可以在这里添加更多自定义环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 