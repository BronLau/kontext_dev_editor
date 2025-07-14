/**
 * 图片处理服务
 * 
 * 功能：
 * - 整合ComfyUI客户端和工作流管理
 * - 提供高级的图片处理API
 * - 管理处理流程和状态
 */

import { ComfyUIClient } from './comfyui';
import { WorkflowManager } from './workflow';
import { ProcessingStatus } from '../types/comfyui';

export interface ProcessImageParams {
  imageFile: File;
  prompt: string;
  onProgress?: (status: ProcessingStatus) => void;
}

export interface ProcessImageResult {
  imageUrl: string;
  imageBlob: Blob;
  promptId: string;
  processingTime: number;
}

export class ImageProcessor {
  private comfyClient: ComfyUIClient;
  private workflowManager: WorkflowManager;
  private isInitialized: boolean = false;

  constructor(comfyUIBaseUrl?: string) {
    this.comfyClient = new ComfyUIClient(comfyUIBaseUrl);
    this.workflowManager = new WorkflowManager();
  }

  /**
   * 初始化图片处理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 检查ComfyUI服务状态
      console.log('检查ComfyUI服务连接...');
      await this.comfyClient.checkStatus();
      console.log('ComfyUI服务连接正常');

      // 加载工作流
      console.log('加载工作流文件...');
      await this.workflowManager.loadWorkflow();
      console.log('工作流加载完成');

      this.isInitialized = true;
      console.log('图片处理器初始化完成');
    } catch (error) {
      console.error('图片处理器初始化失败:', error);
      throw new Error(`初始化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 处理图片 - 主要API接口
   */
  async processImage({
    imageFile,
    prompt,
    onProgress
  }: ProcessImageParams): Promise<ProcessImageResult> {
    const startTime = Date.now();

    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 步骤1: 上传图片
      console.log('步骤1: 上传图片到ComfyUI...');
      onProgress?.({
        status: 'pending',
        message: '正在上传图片...'
      });

      const uploadResult = await this.comfyClient.uploadImage(imageFile);
      console.log('图片上传成功:', uploadResult.name);

      // 步骤2: 创建工作流实例
      console.log('步骤2: 准备工作流...');
      onProgress?.({
        status: 'pending',
        message: '准备处理工作流...'
      });

      const workflow = this.workflowManager.createWorkflowInstance({
        imageName: uploadResult.name,
        prompt: prompt
      });

      // 验证工作流
      const validation = this.workflowManager.validateWorkflow(workflow);
      if (!validation.isValid) {
        throw new Error(`工作流验证失败: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('工作流警告:', validation.warnings);
      }

      // 步骤3: 提交到处理队列
      console.log('步骤3: 提交处理任务...');
      onProgress?.({
        status: 'pending',
        message: '提交处理任务...'
      });

      const queueResult = await this.comfyClient.queuePrompt(workflow);
      console.log('任务提交成功，等待处理:', queueResult.prompt_id);

      // 步骤4: 等待处理完成
      console.log('步骤4: 等待处理完成...');
      const history = await this.comfyClient.waitForCompletion(
        queueResult.prompt_id,
        onProgress
      );

      // 步骤5: 获取结果图片
      console.log('步骤5: 获取处理结果...');
      onProgress?.({
        status: 'running',
        message: '下载处理结果...',
        promptId: queueResult.prompt_id
      });

      const historyItem = history[queueResult.prompt_id];
      if (!historyItem || !historyItem.outputs) {
        throw new Error('处理完成但未找到输出结果');
      }

      // 查找输出图片
      const outputImages = this.findOutputImages(historyItem.outputs);
      if (outputImages.length === 0) {
        throw new Error('未找到输出图片');
      }

      // 获取第一张输出图片
      const firstImage = outputImages[0];
      const imageBlob = await this.comfyClient.getImage(
        firstImage.filename,
        firstImage.subfolder,
        firstImage.type
      );

      // 创建本地URL
      const imageUrl = URL.createObjectURL(imageBlob);

      const processingTime = Date.now() - startTime;
      console.log(`图片处理完成，耗时: ${processingTime}ms`);

      onProgress?.({
        status: 'completed',
        message: '处理完成',
        promptId: queueResult.prompt_id
      });

      return {
        imageUrl,
        imageBlob,
        promptId: queueResult.prompt_id,
        processingTime
      };

    } catch (error) {
      console.error('图片处理失败:', error);
      onProgress?.({
        status: 'failed',
        message: error instanceof Error ? error.message : '处理失败'
      });
      throw error;
    }
  }

  /**
   * 从输出结果中查找图片
   */
  private findOutputImages(outputs: Record<string, any>): Array<{
    filename: string;
    subfolder: string;
    type: string;
  }> {
    const images: Array<{
      filename: string;
      subfolder: string;
      type: string;
    }> = [];

    for (const [, output] of Object.entries(outputs)) {
      if (output.images && Array.isArray(output.images)) {
        for (const image of output.images) {
          images.push({
            filename: image.filename,
            subfolder: image.subfolder || '',
            type: image.type || 'output'
          });
        }
      }
    }

    return images;
  }

  /**
   * 检查服务状态
   */
  async checkServiceHealth(): Promise<{
    comfyUI: boolean;
    workflow: boolean;
    message: string;
  }> {
    try {
      // 检查ComfyUI连接
      await this.comfyClient.checkStatus();
      const comfyUIStatus = true;

      // 检查工作流
      let workflowStatus = false;
      try {
        await this.workflowManager.loadWorkflow();
        workflowStatus = true;
      } catch (error) {
        console.warn('工作流检查失败:', error);
      }

      return {
        comfyUI: comfyUIStatus,
        workflow: workflowStatus,
        message: comfyUIStatus && workflowStatus ? '服务正常' : '部分服务异常'
      };
    } catch (error) {
      return {
        comfyUI: false,
        workflow: false,
        message: `服务异常: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }

  /**
   * 中断当前处理
   */
  async interruptProcessing(): Promise<void> {
    try {
      await this.comfyClient.interruptQueue();
      console.log('处理已中断');
    } catch (error) {
      console.error('中断处理失败:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.workflowManager.reset();
    this.isInitialized = false;
  }
} 