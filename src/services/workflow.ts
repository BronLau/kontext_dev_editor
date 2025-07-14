/**
 * ComfyUI工作流管理服务
 * 
 * 功能：
 * - 读取和解析工作流JSON文件
 * - 动态注入用户参数（图片、提示词）
 * - 验证工作流完整性
 */

import { ComfyUIWorkflow } from '../types/comfyui';

export class WorkflowManager {
  private baseWorkflow: ComfyUIWorkflow | null = null;

  /**
   * 加载工作流JSON文件
   */
  async loadWorkflow(): Promise<ComfyUIWorkflow> {
    try {
      // 从public目录或workflows目录获取工作流文件
      const response = await fetch('/workflows/Kontext_Image_Edit.json');
      
      if (!response.ok) {
        throw new Error(`无法加载工作流文件: ${response.statusText}`);
      }

      const workflow = await response.json();
      this.baseWorkflow = workflow;
      
      console.log('工作流加载成功:', Object.keys(workflow).length, '个节点');
      return workflow;
    } catch (error) {
      console.error('工作流加载失败:', error);
      throw new Error(`工作流加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建带参数的工作流实例
   */
  createWorkflowInstance(params: {
    imageName: string;
    prompt: string;
  }): ComfyUIWorkflow {
    if (!this.baseWorkflow) {
      throw new Error('工作流未加载，请先调用 loadWorkflow()');
    }

    // 深拷贝基础工作流
    const workflow = JSON.parse(JSON.stringify(this.baseWorkflow));

    try {
      // 修改图片输入节点 (节点13 - LoadImage)
      if (workflow['13'] && workflow['13'].class_type === 'LoadImage') {
        workflow['13'].inputs.image = params.imageName;
        console.log('设置输入图片:', params.imageName);
      } else {
        console.warn('未找到LoadImage节点，图片输入可能失败');
      }

      // 修改文本输入节点 (节点16 - 翻译节点)
      if (workflow['16']) {
        workflow['16'].inputs.text = params.prompt;
        console.log('设置提示词:', params.prompt);
      } else {
        console.warn('未找到文本输入节点，提示词可能失败');
      }

      return workflow;
    } catch (error) {
      console.error('工作流参数注入失败:', error);
      throw new Error(`工作流参数注入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 验证工作流完整性
   */
  validateWorkflow(workflow: ComfyUIWorkflow): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查必需的节点
    const requiredNodes = {
      '13': 'LoadImage',
      '16': '翻译节点',
      '15': 'SaveImage',
      '3': 'VAEDecode',
      '14': 'KSampler'
    };

    for (const [nodeId, nodeName] of Object.entries(requiredNodes)) {
      if (!workflow[nodeId]) {
        errors.push(`缺少必需节点: ${nodeName} (${nodeId})`);
      }
    }

    // 检查节点连接和参数
    if (workflow['13']) {
      if (!workflow['13'].inputs.image || typeof workflow['13'].inputs.image !== 'string') {
        warnings.push('LoadImage节点缺少有效的图片输入');
      }
    }

    if (workflow['16']) {
      if (!workflow['16'].inputs.text || typeof workflow['16'].inputs.text !== 'string') {
        warnings.push('文本节点缺少有效的提示词输入');
      }
    }

    // 检查输出节点
    if (workflow['15'] && workflow['15'].class_type === 'SaveImage') {
      if (!workflow['15'].inputs.images) {
        errors.push('SaveImage节点缺少图片输入连接');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取工作流节点信息
   */
  getWorkflowInfo(workflow: ComfyUIWorkflow): {
    nodeCount: number;
    inputNodes: string[];
    outputNodes: string[];
    processingNodes: string[];
  } {
    const inputNodes: string[] = [];
    const outputNodes: string[] = [];
    const processingNodes: string[] = [];

    for (const [nodeId, node] of Object.entries(workflow)) {
      const classType = node.class_type;

      if (classType.includes('Load') || classType.includes('Input')) {
        inputNodes.push(`${nodeId}: ${classType}`);
      } else if (classType.includes('Save') || classType.includes('Output')) {
        outputNodes.push(`${nodeId}: ${classType}`);
      } else {
        processingNodes.push(`${nodeId}: ${classType}`);
      }
    }

    return {
      nodeCount: Object.keys(workflow).length,
      inputNodes,
      outputNodes,
      processingNodes
    };
  }

  /**
   * 重置工作流管理器
   */
  reset(): void {
    this.baseWorkflow = null;
  }
} 