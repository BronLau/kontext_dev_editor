import React, { useCallback, useState } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { useAppStore, useCurrentImage, useCurrentPrompt, useIsProcessing } from '../store/useAppStore';

/**
 * 提示词输入组件 - 极简设计
 */
const PromptInput: React.FC = () => {
  const currentImage = useCurrentImage();
  const currentPrompt = useCurrentPrompt();
  const isProcessing = useIsProcessing();
  const { setCurrentPrompt, setError, setIsProcessing, setCurrentImage, addToHistory } = useAppStore();
  
  const [localPrompt, setLocalPrompt] = useState(currentPrompt);

  // 同步外部状态到本地状态
  React.useEffect(() => {
    setLocalPrompt(currentPrompt);
  }, [currentPrompt]);

  // 处理提示词输入
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalPrompt(value);
    setCurrentPrompt(value);
  }, [setCurrentPrompt]);

  // 真实的ComfyUI图片处理API调用
  const processImage = useCallback(async (imageFile: File, prompt: string): Promise<string> => {
    // 动态导入图片处理服务
    const { ImageProcessor } = await import('../services/imageProcessor');
    
    try {
      const processor = new ImageProcessor();
      
      const result = await processor.processImage({
        imageFile,
        prompt,
        onProgress: (status) => {
          console.log('处理进度:', status);
          // 这里可以添加进度显示逻辑
        }
      });
      
      return result.imageUrl;
    } catch (error) {
      console.error('ComfyUI处理失败:', error);
      throw new Error(`图片处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, []);

  // 处理图片处理请求
  const handleProcess = useCallback(async () => {
    if (!currentImage?.file || !localPrompt.trim()) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const processedImageUrl = await processImage(currentImage.file, localPrompt.trim());
      
      // 创建处理后的图片对象
      const processedImage = {
        ...currentImage,
        id: `${Date.now()}-proc`,
        url: processedImageUrl,
        prompt: localPrompt.trim(),
        timestamp: Date.now(),
      };
      
      // 先设置当前图片为处理后的图片
      setCurrentImage(processedImage);
      
      // 然后将处理后的图片添加到历史记录
      addToHistory({
        id: `${Date.now()}-hist`,
        image: processedImage,
        prompt: localPrompt.trim(),
        timestamp: Date.now(),
      });
      
    } catch (error) {
      console.error('Image processing failed:', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = '图片处理失败，请重试';
      
      if (error instanceof Error) {
        if (error.message.includes('无法连接到ComfyUI服务')) {
          errorMessage = 'ComfyUI服务未启动，请确保本地服务正在运行 (localhost:8188)';
        } else if (error.message.includes('工作流')) {
          errorMessage = '工作流配置错误，请检查工作流文件';
        } else if (error.message.includes('图片上传')) {
          errorMessage = '图片上传失败，请检查文件格式 (支持 JPG、PNG)';
        } else if (error.message.includes('超时')) {
          errorMessage = '处理超时，图片可能过大或服务繁忙，请稍后重试';
        } else {
          errorMessage = `处理失败: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [currentImage, localPrompt, currentPrompt, setIsProcessing, setError, setCurrentImage, addToHistory, processImage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
      handleProcess();
    }
  }, [handleProcess, isProcessing]);

  const canProcess = currentImage && localPrompt.trim() && !isProcessing;

  return (
    <div className="w-full">
      <div className="relative">
        <div className={`
          flex items-center bg-dark-surface border border-dark-border rounded-xl 
          overflow-hidden focus-within:border-primary-400 transition-all duration-200
        `}>
          <input
            type="text"
            value={localPrompt}
            onChange={handlePromptChange}
            onKeyPress={handleKeyPress}
            placeholder="告诉我们您想要的修改..."
            className="flex-1 bg-transparent text-dark-text placeholder-dark-text-muted 
                      px-4 py-3 text-base outline-none"
            disabled={isProcessing}
          />
          
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            className={`
              m-1 px-4 py-2 rounded-lg font-medium text-white
              transition-all duration-200 flex items-center space-x-2
              ${canProcess 
                ? 'bg-primary-500 hover:bg-primary-600 shadow-lg' 
                : 'bg-gray-600 cursor-not-allowed opacity-50'
              }
            `}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">处理中</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span className="text-sm">生成</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput; 