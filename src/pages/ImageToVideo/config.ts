/**
 * 视频生成模式配置
 */

// 模式标签映射
export const modeLabels: Record<string, string> = {
  't2v': '文生视频',
  'i2v': '首帧模式',
  'flf2v': '首尾帧模式',
  'ref2v': '参考图模式',
};

// 模式说明
export const modeDescriptions: Record<string, string> = {
  'i2v': '首帧：单张图片作为视频首帧',
  'flf2v': '首尾帧：第1张为首帧，第2张为尾帧',
  'ref2v': '参考图：AI 参考所有图片风格生成',
  't2v': '文生视频：仅根据文字描述生成',
};

/**
 * 判断模式是否可用（根据图片数量和模型支持）
 */
export function isModeAvailable(
  mode: string,
  imageCount: number,
  supportedModes: string[]
): boolean {
  if (!supportedModes.includes(mode)) return false;

  switch (mode) {
    case 'i2v':
      return imageCount === 1;
    case 'flf2v':
      return imageCount === 2;
    case 'ref2v':
      return imageCount >= 1 && imageCount <= 4;
    case 't2v':
      return imageCount === 0;
    default:
      return false;
  }
}

/**
 * 根据图片数量和模型支持的模式，获取推荐的模式
 */
export function getRecommendedMode(
  imageCount: number,
  supportedModes: string[],
  currentMode?: string
): string {
  // 如果当前模式仍然可用，保持不变
  if (currentMode && isModeAvailable(currentMode, imageCount, supportedModes)) {
    return currentMode;
  }

  // 否则自动选择合适的模式
  if (imageCount === 0 && supportedModes.includes('t2v')) {
    return 't2v';
  }
  if (imageCount === 1 && supportedModes.includes('i2v')) {
    return 'i2v';
  }
  if (imageCount === 2) {
    // 2张图优先 ref2v
    if (supportedModes.includes('ref2v')) return 'ref2v';
    if (supportedModes.includes('flf2v')) return 'flf2v';
  }
  if (imageCount >= 1 && supportedModes.includes('ref2v')) {
    return 'ref2v';
  }

  // 兜底返回第一个支持的模式
  return supportedModes[0] || 'i2v';
}

/**
 * 根据模型支持的模式计算最大图片数量
 */
export function getMaxImageCount(
  supportedModes: string[],
  maxImages?: number
): number {
  if (supportedModes.includes('ref2v')) return maxImages || 4;
  if (supportedModes.includes('flf2v')) return 2;
  return 1;
}
