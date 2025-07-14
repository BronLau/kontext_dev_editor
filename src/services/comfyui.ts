/**
 * ComfyUI客户端服务
 * 
 * 功能：
 * - 管理与ComfyUI后端的HTTP通信
 * - 提供图片上传、工作流执行、结果获取等核心API
 * - 处理错误和状态管理
 */

import {
  ComfyUIWorkflow,
  ImageUploadResponse,
  QueuePromptRequest,
  QueuePromptResponse,
  QueueStatus,
  HistoryResponse,
  SystemStats,
  ProcessingStatus,
  ComfyUIErrorClass
} from '../types/comfyui';

export class ComfyUIClient {
  private baseUrl: string;
  private clientId: string;

  constructor(baseUrl?: string) {
    // 开发环境使用代理，生产环境直接连接
    if (!baseUrl) {
      this.baseUrl = import.meta.env.DEV 
        ? '/api/comfyui'  // 开发环境使用代理
        : 'http://localhost:8188';  // 生产环境直接连接
    } else {
      this.baseUrl = baseUrl;
    }
    this.clientId = this.generateClientId();
  }

  /**
   * 生成唯一的客户端ID
   */
  private generateClientId(): string {
    return `kontext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 通用HTTP请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`ComfyUI API 请求失败 [${endpoint}]:`, error);
      throw new ComfyUIErrorClass({
        type: 'network_error',
        message: `无法连接到ComfyUI服务: ${error instanceof Error ? error.message : '未知错误'}`,
        details: error
      });
    }
  }

  /**
   * 检查ComfyUI服务状态
   */
  async checkStatus(): Promise<SystemStats> {
    return this.request<SystemStats>('/system_stats');
  }

  /**
   * 上传图片到ComfyUI
   */
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'input');
    formData.append('subfolder', '');

    try {
      console.log(`正在上传图片到: ${this.baseUrl}/upload/image`);
      console.log(`文件信息: ${file.name}, 类型: ${file.type}, 大小: ${file.size} bytes`);
      
      const response = await fetch(`${this.baseUrl}/upload/image`, {
        method: 'POST',
        body: formData,
      });

      console.log(`上传响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = response.statusText;
        }
        
        console.error(`上传失败响应: ${errorText}`);
        
        // 根据状态码提供更具体的错误信息
        if (response.status === 403) {
          throw new Error('CORS错误：无法连接到ComfyUI服务，请检查服务配置');
        } else if (response.status === 413) {
          throw new Error('文件过大：请上传小于10MB的图片');
        } else if (response.status === 415) {
          throw new Error('不支持的文件格式：请上传JPG或PNG格式的图片');
        } else if (response.status >= 500) {
          throw new Error('ComfyUI服务器错误：请检查ComfyUI服务状态');
        } else {
          throw new Error(`上传失败 (${response.status}): ${errorText || response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('上传成功:', result);
      return result;
    } catch (error) {
      console.error('图片上传失败:', error);
      
      // 如果是我们自定义的错误，直接重新抛出
      if (error instanceof Error && error.message.includes('CORS错误')) {
        throw error;
      }
      
      // 网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败：无法连接到ComfyUI服务 (localhost:8188)');
      }
      
      throw new ComfyUIErrorClass({
        type: 'upload_error',
        message: error instanceof Error ? error.message : '图片上传失败，请检查文件格式和大小',
        details: error
      });
    }
  }

  /**
   * 提交工作流到处理队列
   */
  async queuePrompt(workflow: ComfyUIWorkflow): Promise<QueuePromptResponse> {
    const request: QueuePromptRequest = {
      prompt: workflow,
      client_id: this.clientId,
    };

    return this.request<QueuePromptResponse>('/prompt', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<QueueStatus> {
    return this.request<QueueStatus>('/queue');
  }

  /**
   * 获取历史记录
   */
  async getHistory(promptId?: string): Promise<HistoryResponse> {
    const endpoint = promptId ? `/history/${promptId}` : '/history';
    return this.request<HistoryResponse>(endpoint);
  }

  /**
   * 获取处理结果图片
   */
  async getImage(
    filename: string,
    subfolder: string = '',
    type: string = 'output'
  ): Promise<Blob> {
    const params = new URLSearchParams({
      filename,
      subfolder,
      type,
    });

    try {
      const response = await fetch(`${this.baseUrl}/view?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('获取图片失败:', error);
      throw new ComfyUIErrorClass({
        type: 'download_error',
        message: '无法获取处理后的图片',
        details: error
      });
    }
  }

  /**
   * 等待工作流执行完成
   */
  async waitForCompletion(
    promptId: string,
    onProgress?: (status: ProcessingStatus) => void,
    timeout: number = 300000 // 5分钟超时
  ): Promise<HistoryResponse> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1秒轮询一次

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          // 检查超时
          if (Date.now() - startTime > timeout) {
            reject(new ComfyUIErrorClass({
              type: 'timeout_error',
              message: '处理超时，请稍后重试',
              details: { promptId, timeout }
            }));
            return;
          }

          // 获取历史记录
          const history = await this.getHistory(promptId);
          
          if (history[promptId]) {
            const item = history[promptId];
            const status = item.status;

            // 通知进度回调
            if (onProgress) {
              onProgress({
                status: status.completed ? 'completed' : 'running',
                promptId,
                message: status.status_str
              });
            }

            // 检查是否完成
            if (status.completed) {
              resolve(history);
              return;
            }
          } else {
            // 还在队列中，通知pending状态
            if (onProgress) {
              onProgress({
                status: 'pending',
                promptId,
                message: '等待处理中...'
              });
            }
          }

          // 继续轮询
          setTimeout(checkStatus, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  /**
   * 中断处理队列
   */
  async interruptQueue(): Promise<void> {
    return this.request<void>('/interrupt', {
      method: 'POST',
    });
  }

  /**
   * 清空队列
   */
  async clearQueue(): Promise<void> {
    return this.request<void>('/queue', {
      method: 'DELETE',
      body: JSON.stringify({ clear: true }),
    });
  }
} 