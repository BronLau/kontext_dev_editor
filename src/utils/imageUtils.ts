import { SUPPORTED_IMAGE_TYPES, SupportedImageType, UploadError } from '../types';

/**
 * 验证文件是否为支持的图片格式
 */
export const validateImageFile = (file: File): UploadError | null => {
  // 检查文件类型
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType)) {
    return {
      type: 'FILE_TYPE',
      message: `不支持的文件格式。请上传 JPG 或 PNG 格式的图片。`
    };
  }
  
  // 检查文件大小（限制为 10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      type: 'FILE_SIZE',
      message: `文件大小超过限制。请上传小于 10MB 的图片。`
    };
  }
  
  return null;
};

/**
 * 将文件转换为 Base64 字符串
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('文件读取失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

/**
 * 将文件转换为 URL 对象
 */
export const fileToURL = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * 清理 URL 对象，释放内存
 */
export const revokeURL = (url: string): void => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * 获取图片的自然尺寸
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = fileToURL(file);
    
    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      revokeURL(url);
      resolve(dimensions);
    };
    
    img.onerror = () => {
      revokeURL(url);
      reject(new Error('无法加载图片'));
    };
    
    img.src = url;
  });
};

/**
 * 下载图片文件
 */
export const downloadImage = (url: string, filename: string = 'kontext-image.png'): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 检查是否为图片 URL
 */
export const isImageURL = (url: string): boolean => {
  return url.startsWith('data:image/') || url.startsWith('blob:') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

/**
 * 生成缩略图（Canvas 实现）
 */
export const generateThumbnail = (
  file: File, 
  maxWidth: number = 150, 
  maxHeight: number = 150
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const url = fileToURL(file);
    
    if (!ctx) {
      revokeURL(url);
      reject(new Error('无法创建 Canvas 上下文'));
      return;
    }
    
    img.onload = () => {
      // 计算缩略图尺寸，保持宽高比
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制缩略图
      ctx.drawImage(img, 0, 0, width, height);
      
      // 转换为 Base64
      const thumbnailDataURL = canvas.toDataURL('image/png', 0.8);
      
      revokeURL(url);
      resolve(thumbnailDataURL);
    };
    
    img.onerror = () => {
      revokeURL(url);
      reject(new Error('无法加载图片'));
    };
    
    img.src = url;
  });
}; 