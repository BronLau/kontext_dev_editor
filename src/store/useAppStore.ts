import { create } from 'zustand';
import { ImageInfo, HistoryItem, AppState } from '../types';

// 应用状态管理接口
interface AppStore extends AppState {
  // 设置当前图片
  setCurrentImage: (image: ImageInfo | null) => void;
  // 设置提示词
  setCurrentPrompt: (prompt: string) => void;
  // 设置处理状态
  setIsProcessing: (isProcessing: boolean) => void;
  // 设置加载状态
  setIsLoading: (isLoading: boolean) => void;
  // 设置错误信息
  setError: (error: string | null) => void;
  // 添加历史记录
  addToHistory: (item: HistoryItem) => void;
  // 从历史记录切换到指定图片
  switchToHistoryItem: (historyId: string) => void;
  // 清除历史记录
  clearHistory: () => void;
  // 清除错误
  clearError: () => void;
  // 重置应用状态
  reset: () => void;
}

// 初始状态
const initialState: AppState = {
  currentImage: null,
  currentPrompt: '',
  isProcessing: false,
  history: [],
  error: null,
  isLoading: false,
};

// 创建 Zustand store
export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  setCurrentImage: (image) => set({ currentImage: image }),

  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  addToHistory: (item) => {
    const { history } = get();
    const newHistory = [item, ...history];
    
    // 限制历史记录数量（最多保留 20 条）
    const limitedHistory = newHistory.slice(0, 20);
    
    set({ history: limitedHistory });
  },

  switchToHistoryItem: (historyId) => {
    const { history } = get();
    const historyItem = history.find(item => item.id === historyId);
    
    if (historyItem) {
      // 只切换当前显示的图片和提示词，不修改历史记录
      set({
        currentImage: historyItem.image,
        currentPrompt: historyItem.prompt,
      });
    }
  },

  clearHistory: () => set({ history: [] }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));

// 导出单独的选择器函数，用于性能优化
export const useCurrentImage = () => useAppStore(state => state.currentImage);
export const useCurrentPrompt = () => useAppStore(state => state.currentPrompt);
export const useIsProcessing = () => useAppStore(state => state.isProcessing);
export const useIsLoading = () => useAppStore(state => state.isLoading);
export const useError = () => useAppStore(state => state.error);
export const useHistory = () => useAppStore(state => state.history); 