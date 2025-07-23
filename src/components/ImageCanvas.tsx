import React, { useCallback, useRef, useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import { useAppStore, useCurrentImage, useIsProcessing, useHistory } from '../store/useAppStore';
import { validateImageFile, fileToURL, getImageDimensions, downloadImage } from '../utils/imageUtils';
import { ImageInfo } from '../types';

/**
 * 图片画布组件 - easyedit.io 风格
 * 
 * 功能：
 * - 大尺寸中央上传区域
 * - easyedit.io 风格的"Drop a photo or click to upload"体验
 * - 图片显示和处理状态
 * - 一键下载功能
 */
const ImageCanvas: React.FC = () => {
  const currentImage = useCurrentImage();
  const isProcessing = useIsProcessing();
  const history = useHistory();
  const { setCurrentImage, setError, clearError } = useAppStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 处理文件上传
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    clearError();
    
    // 验证文件
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError.message);
      return;
    }
    
    try {
      // 获取图片尺寸
      const dimensions = await getImageDimensions(file);
      
      // 创建图片信息对象
      const imageInfo: ImageInfo = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: fileToURL(file),
        file: file,
        timestamp: Date.now(),
        width: dimensions.width,
        height: dimensions.height,
      };
      
      setCurrentImage(imageInfo);
    } catch (error) {
      setError('图片加载失败，请重试');
    }
  }, [setCurrentImage, setError, clearError]);

  // 拖拽处理函数
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // 点击上传
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  }, [handleFileUpload]);

  // 下载图片
  const handleDownload = useCallback(() => {
    if (currentImage) {
      const filename = `kontext-${new Date().getTime()}.png`;
      downloadImage(currentImage.url, filename);
    }
  }, [currentImage]);

  // 删除当前图片
  const handleDeleteImage = useCallback(() => {
    // 清除当前图片，返回到上传界面
    setCurrentImage(null);
    clearError();
    
    // 重置文件输入框
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setCurrentImage, clearError]);

  // 计算正确的版本号
  // v1应该是第一次编辑的图片，v2、v3等是后续版本
  let version = history.length + 1;
  if (currentImage) {
    const historyIndex = history.findIndex(item => item.image.id === currentImage.id);
    if (historyIndex !== -1) {
      // 历史记录中最新的在前面(index 0)，最旧的在后面
      // 所以版本号应该是总数减去当前位置
      version = history.length - historyIndex;
    }
  }

  return (
    <div className="relative w-full">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {!currentImage ? (
        /* 简洁上传区域 - 类似 Together.ai 风格 */
        <div
          className={`
            relative aspect-[4/3] max-w-2xl mx-auto
            border-2 border-dashed rounded-lg
            transition-all duration-300 cursor-pointer
            ${isDragOver 
              ? 'border-gray-400 bg-gray-400/5' 
              : 'border-gray-600 hover:border-gray-500'
            }
            bg-transparent
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="text-center">
              <p className="text-lg text-gray-300 mb-2">
                {isDragOver ? '释放以上传图片' : '拖拽图片到此处'}
              </p>
              <p className="text-sm text-gray-500">
                或点击选择文件
              </p>
            </div>
          </div>
          
          {/* 底部标识 */}
          <div className="absolute bottom-4 right-4 text-xs text-gray-600">
            Powered by <span className="text-gray-400">ComfyUI</span>
          </div>
        </div>
      ) : (
        /* 灰色容器区域 - 4:3比例 */
        <div className="relative w-full max-w-4xl mx-auto bg-gray-800 rounded-lg aspect-[4/3] flex items-center justify-center p-6">
          {/* 图片显示区域 */}
          <div className="relative flex items-center justify-center w-full h-full">
            <img
              src={currentImage.url}
              alt="编辑中的图片"
              className="max-w-full max-h-full object-contain rounded"
              draggable={false}
            />
            
            {/* 处理中的遮罩层 */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-4 text-white">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-xl font-medium">AI 处理中...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* 版本号 */}
          <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 text-xs bg-black/60 text-white w-6 h-6 flex items-center justify-center rounded">
            v{version}
          </div>

          {/* 容器右上角的删除按钮 */}
          {!isProcessing && (
            <button
              onClick={handleDeleteImage}
              className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 
                        text-gray-300 hover:text-white p-2 rounded-lg 
                        transition-all duration-200 shadow-lg
                        hover:scale-105"
              title="删除图片并重新上传"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* 容器右下角的下载按钮 */}
          {!isProcessing && (
            <button
              onClick={handleDownload}
              className="absolute bottom-4 right-4 bg-gray-700 hover:bg-gray-600 
                        text-gray-300 hover:text-white p-2 rounded-lg 
                        transition-all duration-200 shadow-lg
                        hover:scale-105"
              title="下载图片"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCanvas; 