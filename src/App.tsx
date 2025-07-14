import ImageCanvas from './components/ImageCanvas';
import PromptInput from './components/PromptInput';
import HistoryPanel from './components/HistoryPanel';
import ErrorToast from './components/ErrorToast';
import { useError, useCurrentImage } from './store/useAppStore';

/**
 * 主应用组件 - easyedit.io 风格极简设计
 * 
 * 布局结构：
 * - 左侧：历史记录缩略图列表（垂直布局）
 * - 中央：图片编辑主区域（包含上传、显示、提示词输入）
 * - 全局：错误提示 Toast
 */
function App() {
  const error = useError();
  const currentImage = useCurrentImage();

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* 主编辑区域 - 全屏居中布局 */}
      <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
        {!currentImage ? (
          /* 未上传图片时 - 只显示上传区域 */
          <div className="w-full max-w-4xl">
            <ImageCanvas />
          </div>
        ) : (
          /* 已上传图片时 - 显示完整布局 */
          <div className="flex items-start justify-center w-full max-w-7xl min-h-0">
            {/* 历史记录面板 - 位于灰色区域左侧 */}
            <div className="hidden sm:block w-32 flex-shrink-0 mr-8 relative z-10 self-stretch">
              <HistoryPanel />
            </div>
            
            {/* 主工作区域 */}
            <div className="flex flex-col items-center space-y-6 md:space-y-8">
              {/* 图片编辑主区域 */}
              <div className="w-full">
                <ImageCanvas />
              </div>
              
              {/* 提示词输入区域 */}
              <div className="w-full max-w-2xl">
                <PromptInput />
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* 错误提示 Toast */}
      {error && <ErrorToast />}
    </div>
  );
}

export default App; 