/**
 * 图片处理相关类型定义
 */

// 图片信息接口
export interface ImageInfo {
  id: string;
  url: string;
  file?: File;
  prompt?: string;
  timestamp: number;
  width?: number;
  height?: number;
}

// 历史记录项接口
export interface HistoryItem {
  id: string;
  image: ImageInfo;
  prompt: string;
  timestamp: number;
}

// 应用状态接口
export interface AppState {
  // 当前画布上的图片
  currentImage: ImageInfo | null;
  // 当前输入的提示词
  currentPrompt: string;
  // 是否正在处理
  isProcessing: boolean;
  // 历史记录列表
  history: HistoryItem[];
  // 错误信息
  error: string | null;
  // 是否显示加载状态
  isLoading: boolean;
}

// 处理状态枚举
export enum ProcessingStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// 支持的图片格式
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png'] as const;
export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

// 文件上传错误类型
export interface UploadError {
  type: 'FILE_TYPE' | 'FILE_SIZE' | 'UNKNOWN';
  message: string;
}

// ComfyUI API 相关类型
export interface ComfyUIRequest {
  image: File;
  prompt: string;
}

export interface ComfyUIResponse {
  success: boolean;
  image?: string; // base64 或 URL
  error?: string;
}

// 应用配置
export interface AppConfig {
  comfyUIUrl: string;
  maxImageSize: number; // 最大图片大小（字节）
  maxHistoryItems: number; // 最大历史记录数量
} 