import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useError, useAppStore } from '../store/useAppStore';

/**
 * 错误提示 Toast 组件
 * 
 * 功能：
 * - 显示错误信息
 * - 自动关闭（5秒后）
 * - 手动关闭
 * - 动画效果
 */
const ErrorToast: React.FC = () => {
  const error = useError();
  const { clearError } = useAppStore();

  // 自动关闭定时器
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // 5秒后自动关闭

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // 如果没有错误，不渲染
  if (!error) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg border border-red-600 max-w-md">
        <div className="flex items-start space-x-3">
          {/* 错误图标 */}
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          
          {/* 错误信息 */}
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {error}
            </p>
          </div>
          
          {/* 关闭按钮 */}
          <button
            onClick={clearError}
            className="flex-shrink-0 p-0.5 hover:bg-red-600 rounded transition-colors duration-200"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* 进度条 */}
        <div className="mt-2 w-full bg-red-600 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-red-300 animate-progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default ErrorToast; 