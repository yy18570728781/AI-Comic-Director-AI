export type AIBizType = 'default' | 'ecommerce';

export type AIMediaTaskType = 'image' | 'video';

export type AITaskQueueName = 'image' | 'video' | 'ecommerce-image' | 'ecommerce-video';

/**
 * 根据业务类型和媒体类型解析统一队列名
 */
export function resolveAITaskQueueName(
  taskType: AIMediaTaskType,
  bizType: AIBizType = 'default'
): AITaskQueueName {
  if (bizType === 'ecommerce') {
    return taskType === 'image' ? 'ecommerce-image' : 'ecommerce-video';
  }

  return taskType;
}
