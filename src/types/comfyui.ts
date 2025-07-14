/**
 * ComfyUI API 相关类型定义
 */

// ComfyUI工作流JSON结构
export interface ComfyUIWorkflow {
  [nodeId: string]: {
    inputs: Record<string, any>;
    class_type: string;
    _meta?: {
      title: string;
    };
  };
}

// 图片上传响应
export interface ImageUploadResponse {
  name: string;
  subfolder: string;
  type: string;
}

// 队列提交请求
export interface QueuePromptRequest {
  prompt: ComfyUIWorkflow;
  client_id?: string;
}

// 队列提交响应
export interface QueuePromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any>;
}

// 队列状态
export interface QueueStatus {
  queue_running: Array<[number, string, ComfyUIWorkflow, any]>;
  queue_pending: Array<[number, string, ComfyUIWorkflow, any]>;
}

// 历史记录项
export interface HistoryItem {
  prompt: [number, string, ComfyUIWorkflow, any];
  outputs: Record<string, {
    images?: Array<{
      filename: string;
      subfolder: string;
      type: string;
    }>;
  }>;
  status: {
    status_str: string;
    completed: boolean;
    messages: any[];
  };
}

// 历史记录响应
export interface HistoryResponse {
  [promptId: string]: HistoryItem;
}

// 系统信息
export interface SystemStats {
  system: {
    os: string;
    ram_total: number;
    ram_free: number;
    comfyui_version: string;
    python_version: string;
    pytorch_version: string;
  };
  devices: Array<{
    name: string;
    type: string;
    vram_total: number;
    vram_free: number;
  }>;
}

// ComfyUI处理状态
export interface ProcessingStatus {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  promptId?: string;
}

// 错误类型
export interface ComfyUIError {
  type: string;
  message: string;
  details?: any;
}

// ComfyUI错误类
export class ComfyUIErrorClass extends Error {
  public type: string;
  public details?: any;

  constructor(error: ComfyUIError) {
    super(error.message);
    this.name = 'ComfyUIError';
    this.type = error.type;
    this.details = error.details;
  }
} 