import { Button, Card, Empty, Image, Space, Spin, Tag, Typography } from 'antd';

const { Paragraph, Text } = Typography;

export enum GenerationTimelineItemType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface GenerationTimelineMetaTag {
  label: string;
  color?: string;
}

interface GenerationTimelineBaseItem {
  id: string | number;
  type: GenerationTimelineItemType;
  createdAt?: string;
  requestText?: string;
  description?: string;
  statusText?: string;
  metaTags?: GenerationTimelineMetaTag[];
}

export interface GenerationTimelineTextItem extends GenerationTimelineBaseItem {
  type: GenerationTimelineItemType.TEXT;
  content: string;
}

export interface GenerationTimelineImageItem extends GenerationTimelineBaseItem {
  type: GenerationTimelineItemType.IMAGE;
  images: string[];
}

export interface GenerationTimelineVideoItem extends GenerationTimelineBaseItem {
  type: GenerationTimelineItemType.VIDEO;
  url: string;
}

/**
 * 生成中的真实任务卡片结构
 *
 * 关键逻辑：
 * 1. 待生成任务还没有最终媒体地址，所以单独定义 pending 结构。
 * 2. 页面层负责把 jobId、提示词摘要、参考图等信息传进来，
 *    公共时间线组件只负责渲染，不参与轮询和业务判断。
 */
export interface GenerationTimelinePendingItem {
  id: string | number;
  requestText?: string;
  description?: string;
  statusText?: string;
  metaTags?: GenerationTimelineMetaTag[];
  thumbnail?: string;
}

export type GenerationTimelineItem =
  | GenerationTimelineTextItem
  | GenerationTimelineImageItem
  | GenerationTimelineVideoItem;

interface GenerationTimelineProps {
  items: GenerationTimelineItem[];
  pendingItems?: GenerationTimelinePendingItem[];
  minHeight?: number;
  bottomSafeSpace?: number;
  dayLabel?: string;
  emptyDescription?: string;
  credits?: number;
  generatingText?: string;
  downloadText?: string;
  onDownload?: (url: string) => void;
}

function renderContent(item: GenerationTimelineItem) {
  if (item.type === GenerationTimelineItemType.TEXT) {
    return (
      <Paragraph style={{ marginBottom: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>
        {item.content}
      </Paragraph>
    );
  }

  if (item.type === GenerationTimelineItemType.IMAGE) {
    return (
      <Image.PreviewGroup>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {item.images.map((image, index) => (
            <Image
              key={`${item.id}-image-${index}`}
              src={image}
              style={{
                width: '100%',
                height: 220,
                objectFit: 'cover',
                borderRadius: 14,
              }}
            />
          ))}
        </div>
      </Image.PreviewGroup>
    );
  }

  return (
    <video
      src={item.url}
      controls
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 14,
        background: '#000',
      }}
    />
  );
}

/**
 * 渲染生成中卡片主体。
 * 如果传了参考图，就把参考图和加载态并排展示，能更清楚地对应当前任务。
 */
function renderPendingPreview(item: GenerationTimelinePendingItem) {
  if (item.thumbnail) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px minmax(0, 1fr)',
          gap: 14,
          alignItems: 'stretch',
        }}
      >
        <Image
          src={item.thumbnail}
          preview={false}
          style={{
            width: '100%',
            height: 220,
            objectFit: 'cover',
            borderRadius: 14,
          }}
        />
        <div
          style={{
            height: 220,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 14,
            background: '#f3f6f9',
          }}
        >
          <Spin />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 220,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 14,
        background: '#f3f6f9',
      }}
    >
      <Spin />
    </div>
  );
}

export default function GenerationTimeline({
  items,
  pendingItems = [],
  minHeight = 520,
  bottomSafeSpace = 0,
  dayLabel = '今天',
  emptyDescription = '这里作为滚动展示区域',
  credits,
  generatingText = '任务已提交，正在生成内容...',
  downloadText = '下载内容',
  onDownload,
}: GenerationTimelineProps) {
  const isEmpty = items.length === 0 && pendingItems.length === 0;
  const canDownload =
    typeof onDownload === 'function' &&
    items.some(item => item.type === GenerationTimelineItemType.VIDEO);

  return (
    <div
      style={{
        maxWidth: 920,
        margin: '0 auto',
        paddingBottom: bottomSafeSpace,
      }}
    >
      {isEmpty ? (
        <div
          style={{
            minHeight,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
        </div>
      ) : (
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <div style={{ paddingTop: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: 600, color: '#111827' }}>{dayLabel}</Text>
          </div>

          {items.map(item => (
            <div key={`${item.type}-${item.id}-${item.createdAt || ''}`} style={{ padding: '6px 0 12px' }}>
              {item.requestText ? (
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: 320,
                      padding: '10px 14px',
                      borderRadius: 18,
                      background: '#f0f1f3',
                      color: '#374151',
                      fontSize: 14,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {item.requestText}
                  </div>
                </div>
              ) : null}

              <Card
                bordered={false}
                style={{
                  width: '100%',
                  borderRadius: 18,
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <Tag
                    style={{
                      width: 'fit-content',
                      margin: 0,
                      borderRadius: 999,
                      background: '#eaf6fb',
                      borderColor: '#d7edf7',
                      color: '#4b5563',
                    }}
                  >
                    {item.statusText || '生成已完成'}
                  </Tag>

                  {renderContent(item)}

                  {item.description ? (
                    <Paragraph style={{ marginBottom: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>
                      {item.description}
                    </Paragraph>
                  ) : null}

                  {typeof credits === 'number' ? (
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
                      以上内容由 AI 生成，本次预计消耗约 {credits} 积分
                    </Text>
                  ) : null}

                  <Space size={[8, 8]} wrap>
                    {item.type === GenerationTimelineItemType.VIDEO && canDownload ? (
                      <Button onClick={() => onDownload?.(item.url)}>{downloadText}</Button>
                    ) : null}
                    {item.metaTags?.map((tag, index) => (
                      <Tag key={`${item.id}-meta-${index}`} color={tag.color}>
                        {tag.label}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </Card>
            </div>
          ))}

          {pendingItems.map(item => (
            <div key={`pending-${item.id}`} style={{ padding: '16px 0 12px' }}>
              {item.requestText ? (
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: 320,
                      padding: '10px 14px',
                      borderRadius: 18,
                      background: '#f0f1f3',
                      color: '#374151',
                      fontSize: 14,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {item.requestText}
                  </div>
                </div>
              ) : null}

              <Card
                bordered={false}
                style={{
                  width: '100%',
                  borderRadius: 18,
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                }}
                styles={{ body: { padding: 16 } }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Tag color="processing" style={{ width: 'fit-content', margin: 0, borderRadius: 999 }}>
                    {item.statusText || '生成中'}
                  </Tag>

                  {renderPendingPreview(item)}

                  <Text style={{ color: '#6b7280' }}>{item.description || generatingText}</Text>

                  {item.metaTags?.length ? (
                    <Space size={[8, 8]} wrap>
                      {item.metaTags.map((tag, index) => (
                        <Tag key={`${item.id}-pending-meta-${index}`} color={tag.color}>
                          {tag.label}
                        </Tag>
                      ))}
                    </Space>
                  ) : null}
                </Space>
              </Card>
            </div>
          ))}
        </Space>
      )}
    </div>
  );
}
