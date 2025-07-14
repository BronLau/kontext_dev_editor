import React, { useCallback } from 'react';
import { useAppStore, useHistory } from '../store/useAppStore';
import { HistoryItem } from '../types';

/**
 * 历史记录项组件 - 极简缩略图风格
 */
const HistoryItemComponent: React.FC<{ 
  item: HistoryItem; 
  onSwitch: (id: string) => void; 
  index: number;
  totalCount: number;
}> = ({ item, onSwitch, index, totalCount }) => {
  const handleClick = useCallback(() => {
    onSwitch(item.id);
  }, [item.id, onSwitch]);

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer select-none"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* 缩略图容器 */}
      <div className="relative w-24 h-28 rounded-lg overflow-hidden bg-gray-900
                      border border-dark-border hover:border-primary-400
                      transition-all duration-200 hover:scale-105 flex items-center justify-center">
        <img
          src={item.image.url}
          alt={`版本 ${totalCount - index}`}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        
        {/* 版本标记 */}
        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs w-6 h-6 flex items-center justify-center rounded">
          v{totalCount - index}
        </div>
        
        {/* 悬停效果 */}
        <div className="absolute inset-0 bg-primary-400/20 opacity-0 group-hover:opacity-100 
                        transition-opacity duration-200" />
      </div>
      
      {/* 悬停时显示的提示词预览 */}
      <div className="absolute left-28 top-0 z-10 opacity-0 group-hover:opacity-100
                      pointer-events-none transition-all duration-200 delay-300">
        <div className="bg-dark-surface border border-dark-border rounded-lg p-3 shadow-xl
                        max-w-xs whitespace-normal">
          <p className="text-sm text-dark-text line-clamp-3">
            {item.prompt}
          </p>
          <div className="mt-1 text-xs text-dark-text-dim">
            {new Date(item.timestamp).toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 历史记录面板组件 - 左侧垂直缩略图布局
 * 
 * 功能：
 * - 左侧垂直缩略图列表（类似用户提供的界面图片）
 * - 版本标记（v1, v2, v3...）
 * - 悬停预览提示词
 * - 点击切换历史版本
 */
const HistoryPanel: React.FC = () => {
  const history = useHistory();
  const { switchToHistoryItem } = useAppStore();

  // 处理历史项切换
  const handleHistorySwitch = useCallback((historyId: string) => {
    switchToHistoryItem(historyId);
  }, [switchToHistoryItem]);

  return (
    <div className="h-full flex flex-col p-4 max-h-[32rem] pointer-events-auto select-none">
      {/* 历史记录标题 */}
      <div className="mb-4 flex-shrink-0">
        <p className="text-xs text-center text-dark-text-dim font-medium">
          历史记录
        </p>
      </div>
      
      {/* 历史记录列表 - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {history.length > 0 ? (
          <div className="space-y-4 pb-4">
            {history.map((item, index) => (
              <HistoryItemComponent
                key={item.id}
                item={item}
                onSwitch={handleHistorySwitch}
                index={index}
                totalCount={history.length}
              />
            ))}
          </div>
        ) : (
          /* 空状态 - 优化显示 */
          <div className="flex flex-col items-center justify-center h-full text-dark-text-dim py-8">
            <div className="w-12 h-12 border-2 border-dashed border-dark-border rounded-lg
                          flex items-center justify-center mb-3">
              <span className="text-xs">v1</span>
            </div>
            <p className="text-xs text-center leading-relaxed">
              编辑历史<br />
              将在这里显示
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel; 