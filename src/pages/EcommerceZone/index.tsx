import { useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputNumber, Popover, Select, Switch, Tag, message } from 'antd';
import {
  LinkOutlined,
  PictureOutlined,
  SearchOutlined,
  SettingOutlined,
  SlidersOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { generateEcommerceVideoPrompt } from '@/api/ai';
import GenerationTimeline, {
  GenerationTimelineItem,
  GenerationTimelineItemType,
  GenerationTimelinePendingItem,
} from '@/components/GenerationTimeline';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import { GeneratedVideo, useAIGeneration } from '@/hooks/useAIGeneration';
import useVideoComposer from '@/hooks/useVideoComposer';
import { isModeAvailable } from '@/pages/ImageToVideo/config';
import { useModelStore } from '@/stores/useModelStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useUserStore } from '@/stores/useUserStore';
import { storage } from '@/utils';
import './style.less';

const { TextArea } = Input;

const PUBLISH_PLATFORM_OPTIONS = ['抖音', '快手', '视频号', '小红书'];

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  pricing?: {
    billingMode?: 'per_second' | 'per_video';
    pricingTiers?: Array<{ resolution: string; creditsPerSecond: number }>;
    perVideo?: { creditsPerVideo?: number };
  };
  config?: {
    supportedModes?: string[];
    resolutions?: string[];
    aspectRatios?: string[];
    maxDuration?: number;
    minDuration?: number;
    maxImages?: number;
  };
}

interface EcommerceVideoRecord extends GeneratedVideo {
  createdAt: string;
  prompt: string;
  modelName: string;
  resolution: string;
  ratio: string;
}

interface EcommercePendingRecord {
  jobId: string | number;
  createdAt: string;
  prompt: string;
  publishPlatform: string;
  resolution: string;
  ratio: string;
  duration: number;
  referenceImage?: string;
}

function formatCreatedAtLabel(value?: string) {
  if (!value) return '刚刚';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}年${month}月${day}日 ${hour}:${minute}`;
}

/**
 * 统一拼接最终视频提示词。
 * 主提示词和动作描述都属于生成视频的重要输入，所以这里固定在提交前合并。
 */
function buildFinalPrompt(prompt: string, motionPrompt: string) {
  return [prompt.trim(), motionPrompt.trim()].filter(Boolean).join('，');
}

export default function EcommerceZone() {
  const { videoModel, textModel, setVideoModel, videoModels, loadModels } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();
  const { tasks } = useTaskStore();

  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [targetGender, setTargetGender] = useState<'female' | 'male'>('female');
  const [publishPlatform, setPublishPlatform] = useState('抖音');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<EcommerceVideoRecord[]>(
    () => storage.get<EcommerceVideoRecord[]>('ecommerceZone_generatedVideos', []) ?? []
  );
  const [pendingVideos, setPendingVideos] = useState<EcommercePendingRecord[]>(
    () => storage.get<EcommercePendingRecord[]>('ecommerceZone_pendingVideos', []) ?? []
  );
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  const timelineBottomRef = useRef<HTMLDivElement | null>(null);

  const { generateVideo } = useAIGeneration({
    onVideoComplete: (video) => {
      const currentModel = models.find((item) => item.id === videoModel);
      const finalPrompt = buildFinalPrompt(prompt, motionPrompt);

      const nextRecord: EcommerceVideoRecord = {
        ...video,
        createdAt: new Date().toISOString(),
        prompt: finalPrompt || prompt.trim(),
        modelName: currentModel?.name || videoModel,
        resolution,
        ratio: aspectRatio,
      };

      setGeneratedVideos((prev) => [...prev, nextRecord]);
      refreshPoints();
    },
    showMessage: true,
  });

  useEffect(() => {
    storage.set('ecommerceZone_generatedVideos', generatedVideos);
  }, [generatedVideos]);

  useEffect(() => {
    storage.set('ecommerceZone_pendingVideos', pendingVideos);
  }, [pendingVideos]);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        await loadModels();
      } catch {
        message.error('获取视频模型失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [loadModels]);

  useEffect(() => {
    setModels(videoModels);
    const currentModel = videoModels.find((model) => model.id === videoModel) || videoModels[0];
    if (!currentModel) return;

    if (!videoModel || currentModel.id !== videoModel) {
      setVideoModel(currentModel.id);
    }
  }, [setVideoModel, videoModel, videoModels]);

  useEffect(() => {
    /**
     * 关键逻辑：
     * 1. 真实轮询仍然复用全局任务系统。
     * 2. 电商页只把自己的“展示快照”单独存本地。
     * 3. 当全局任务里已经没有对应的 ecommerce-video 任务时，说明任务已完成或失败，
     *    这里就把本地的生成中卡片清掉，避免刷新后残留假状态。
     */
    const activeJobIds = new Set(
      tasks
        .filter((task) => task.type === 'video' && task.queueName === 'ecommerce-video')
        .map((task) => String(task.jobId))
    );

    setPendingVideos((prev) => prev.filter((item) => activeJobIds.has(String(item.jobId))));
  }, [tasks]);

  const { fields, derived, actions } = useVideoComposer({
    models,
    selectedModelId: videoModel,
    onModelChange: setVideoModel,
    currentPoints: currentUser?.points ?? 0,
  });

  const {
    selectedImages,
    prompt,
    duration,
    resolution,
    aspectRatio,
    batchCount,
    selectedMode,
    saveToLibrary,
    generateAudio,
  } = fields;
  const {
    supportedModes,
    maxImageCount,
    durationOptions,
    modelOptions,
    resolutionOptions,
    aspectRatioOptions,
    modeOptions,
    totalCredits,
    hasEnoughPoints,
  } = derived;
  const {
    setSelectedImages,
    setPrompt,
    setDuration,
    setResolution,
    setAspectRatio,
    setBatchCount,
    setSelectedMode,
    setSaveToLibrary,
    setGenerateAudio,
    handleModelChange,
  } = actions;

  const currentModelName = useMemo(
    () => modelOptions.find((item) => item.value === videoModel)?.label || videoModel || '视频模型',
    [modelOptions, videoModel]
  );

  const feedVideos = useMemo(() => [...generatedVideos].reverse(), [generatedVideos]);
  const characterImage = selectedImages[0];

  const timelineItems = useMemo<GenerationTimelineItem[]>(
    () =>
      generatedVideos.map((item) => ({
        id: item.id,
        type: GenerationTimelineItemType.VIDEO,
        createdAt: item.createdAt,
        requestText: item.prompt || '生成一段电商视频内容',
        description: item.prompt || '未记录描述',
        statusText: '创意已完成',
        url: item.url,
        metaTags: [
          { label: item.modelName },
          { label: item.resolution },
          { label: item.ratio },
        ].filter((tag) => Boolean(tag.label)),
      })),
    [generatedVideos]
  );

  const pendingTimelineItems = useMemo<GenerationTimelinePendingItem[]>(
    () =>
      [...pendingVideos].reverse().map((item) => ({
        id: item.jobId,
        requestText: item.prompt,
        description: '任务已提交，正在生成视频内容，刷新页面后仍会保留这张任务卡片。',
        statusText: `任务 #${item.jobId} 生成中`,
        thumbnail: item.referenceImage,
        metaTags: [
          { label: item.publishPlatform },
          { label: item.resolution },
          { label: item.ratio },
          { label: `${item.duration}s` },
        ],
      })),
    [pendingVideos]
  );

  useEffect(() => {
    /**
     * 关键逻辑：
     * 1. 页面刷新恢复任务后，需要自动滚到时间线底部。
     * 2. 新提交任务或新完成结果进入列表后，也要继续贴着底部显示最新内容。
     * 3. 这里使用底部锚点而不是手算高度，避免后续卡片高度变化时滚动失准。
     */
    const timer = window.setTimeout(() => {
      timelineBottomRef.current?.scrollIntoView({
        block: 'end',
        behavior: 'smooth',
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingTimelineItems.length, timelineItems.length]);

  /**
   * 智能生成视频提示词。
   * 这里仍然只校验人物参考图，并把平台信息一起传给后端提示词服务。
   */
  const handleSmartGeneratePrompt = async () => {
    if (!characterImage) {
      message.warning('请上传参考图');
      return;
    }

    if (isGeneratingPrompt) {
      message.warning('智能生成中，请稍候');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const result = await generateEcommerceVideoPrompt({
        imageUrls: [characterImage],
        model: textModel,
        extraInput: prompt.trim(),
        publishPlatform,
      });

      if (result?.success && result.data?.prompt) {
        setPrompt(String(result.data.prompt).trim());
        message.success('视频提示词已生成');
        return;
      }

      message.error(result?.message || '智能生成失败');
    } catch (error: any) {
      message.error(error.message || '智能生成失败');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  /**
   * 提交视频生成任务。
   *
   * 关键逻辑：
   * 1. 提交成功后立刻把 jobId 和展示快照写入本地 pending 列表。
   * 2. 刷新页面时，这些快照会配合全局 task store 一起恢复成真实任务卡片。
   * 3. 后端接口和全局轮询都继续复用原来的通用实现，这里只补电商页自己的展示层状态。
   */
  const handleGenerate = async () => {
    if (!selectedImages.length) return message.warning('请先上传参考图');
    if (!prompt.trim()) return message.warning('请先填写视频提示词');
    if (isSubmitting) return message.warning('任务提交中，请稍候');
    if (!isModeAvailable(selectedMode, selectedImages.length, supportedModes)) {
      return message.error('当前模式和参考图数量不匹配');
    }
    if (!hasEnoughPoints) return message.warning('积分不足，暂时无法生成');

    const finalPrompt = buildFinalPrompt(prompt, motionPrompt);
    setIsSubmitting(true);

    try {
      for (let index = 0; index < batchCount; index += 1) {
        const jobId = await generateVideo({
          prompt: finalPrompt,
          model: videoModel,
          bizType: 'ecommerce',
          mode: selectedMode as 't2v' | 'i2v' | 'flf2v' | 'ref2v',
          referenceImages: selectedImages,
          duration,
          resolution,
          ratio: aspectRatio,
          generateAudio,
          ...(saveToLibrary
            ? {
                saveToLibrary: true,
                libraryName: `电商视频_${new Date().toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                libraryTags: [
                  '电商专区',
                  '视频生成',
                  targetGender === 'female' ? '女生' : '男生',
                  publishPlatform,
                ],
              }
            : {}),
        });

        if (jobId) {
          setPendingVideos((prev) => [
            ...prev,
            {
              jobId,
              createdAt: new Date().toISOString(),
              prompt: finalPrompt,
              publishPlatform,
              resolution,
              ratio: aspectRatio,
              duration,
              referenceImage: selectedImages[0],
            },
          ]);
        }
      }
    } finally {
      window.setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecommerce-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('视频已开始下载');
  };

  const configPopoverContent = (
    <div className="ecommerce-zone__config-popover">
      <div className="ecommerce-zone__config-list">
        <div className="ecommerce-zone__config-pill">
          <span>目标人群</span>
          <Select
            value={targetGender}
            onChange={(value) => setTargetGender(value)}
            options={[
              { label: '女生', value: 'female' },
              { label: '男生', value: 'male' },
            ]}
            variant="borderless"
            className="ecommerce-zone__pill-select"
          />
        </div>
        <div className="ecommerce-zone__config-pill">
          <span>模式</span>
          <Select
            value={selectedMode}
            onChange={(value) => setSelectedMode(String(value))}
            options={modeOptions}
            variant="borderless"
            className="ecommerce-zone__pill-select"
          />
        </div>
        <div className="ecommerce-zone__config-pill">
          <span>分辨率</span>
          <Select
            value={resolution}
            onChange={(value) => setResolution(String(value))}
            options={resolutionOptions}
            variant="borderless"
            className="ecommerce-zone__pill-select"
          />
        </div>
        <div className="ecommerce-zone__config-pill">
          <span>比例</span>
          <Select
            value={aspectRatio}
            onChange={(value) => setAspectRatio(String(value))}
            options={aspectRatioOptions}
            variant="borderless"
            className="ecommerce-zone__pill-select"
          />
        </div>
        <div className="ecommerce-zone__config-pill">
          <span>时长</span>
          <Select
            value={duration}
            onChange={(value) => setDuration(Number(value))}
            options={durationOptions.map((option) => ({
              label: `${option}s`,
              value: option,
            }))}
            variant="borderless"
            className="ecommerce-zone__pill-select"
          />
        </div>
        <label className="ecommerce-zone__switch-row">
          <Switch size="small" checked={saveToLibrary} onChange={setSaveToLibrary} />
          <span>存素材库</span>
        </label>
        <label className="ecommerce-zone__switch-row">
          <Switch size="small" checked={generateAudio} onChange={setGenerateAudio} />
          <span>生成音频</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="ecommerce-zone">
      <div className="ecommerce-zone__frame">
        <aside className="ecommerce-zone__sidebar">
          <div className="ecommerce-zone__sidebar-top">
            <div className="ecommerce-zone__sidebar-title">AI数字视频</div>
            <Select
              value={videoModel}
              onChange={(value) => handleModelChange(String(value))}
              options={modelOptions}
              variant="borderless"
              className="ecommerce-zone__model-select"
            />
          </div>

          <div className="ecommerce-zone__sidebar-card">
            <div className="ecommerce-zone__role-switch">
              <div
                role="button"
                tabIndex={0}
                className={`ecommerce-zone__role-button ${characterImage ? 'has-image' : ''}`}
                onClick={() => setSelectorVisible(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectorVisible(true);
                  }
                }}
              >
                {characterImage ? (
                  <img src={characterImage} alt="参考图" className="ecommerce-zone__role-image" />
                ) : (
                  <>
                    <UserOutlined />
                    <span>参考图</span>
                  </>
                )}
              </div>
            </div>

            <div className="ecommerce-zone__field-group">
              <div className="ecommerce-zone__field-header">
                <label className="ecommerce-zone__field-label">视频提示词</label>
                <button
                  type="button"
                  className="ecommerce-zone__magic-button"
                  onClick={handleSmartGeneratePrompt}
                  disabled={isGeneratingPrompt}
                >
                  {isGeneratingPrompt ? '生成中...' : '智能生成'}
                </button>
              </div>
              <TextArea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                autoSize={{ minRows: 3, maxRows: 5 }}
                variant="borderless"
                placeholder="输入视频提示词，例如亚洲美女带货洗衣粉，动态自由分镜，镜头推进展示商品细节"
                className="ecommerce-zone__textarea"
              />
            </div>

            <div className="ecommerce-zone__field-group">
              <label className="ecommerce-zone__field-label">发布平台</label>
              <div className="ecommerce-zone__platform-tags">
                {PUBLISH_PLATFORM_OPTIONS.map((item) => (
                  <Tag
                    key={item}
                    className={`ecommerce-zone__platform-tag ${
                      publishPlatform === item ? 'is-active' : ''
                    }`}
                    bordered={false}
                    onClick={() => setPublishPlatform(item)}
                  >
                    {item}
                  </Tag>
                ))}
              </div>
            </div>

            <div className="ecommerce-zone__field-group">
              <label className="ecommerce-zone__field-label">动作描述（可选）</label>
              <TextArea
                value={motionPrompt}
                onChange={(event) => setMotionPrompt(event.target.value)}
                autoSize={{ minRows: 2, maxRows: 4 }}
                variant="borderless"
                placeholder="请描述你想生成的动作、镜头或画面节奏"
                className="ecommerce-zone__textarea"
              />
            </div>

            <div className="ecommerce-zone__field-group">
              <label className="ecommerce-zone__field-label">份数</label>
              <InputNumber
                min={1}
                max={10}
                value={batchCount}
                onChange={(value) => setBatchCount(Number(value) || 1)}
                controls
                className="ecommerce-zone__batch-input"
              />
            </div>

            <div className="ecommerce-zone__visual-panel">
              <div className="ecommerce-zone__preview-strip">
                <div className="ecommerce-zone__preview-meta">
                  <span>{currentModelName}</span>
                  <span>{resolution}</span>
                  <span>{aspectRatio}</span>
                </div>
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  overlayClassName="ecommerce-zone__config-popover-overlay"
                  content={configPopoverContent}
                >
                  <button type="button" className="ecommerce-zone__config-trigger">
                    <SlidersOutlined />
                  </button>
                </Popover>
              </div>

              <div className="ecommerce-zone__status-row">
                <span>
                  <PictureOutlined /> {selectedImages.length}/{maxImageCount} 图
                </span>
                <span>{totalCredits} 积分</span>
              </div>
              <div className="ecommerce-zone__current-points">
                当前积分 {currentUser?.points ?? 0}
              </div>
            </div>

            <button
              type="button"
              className="ecommerce-zone__submit"
              onClick={handleGenerate}
              disabled={loading || isSubmitting || !hasEnoughPoints}
            >
              {isSubmitting ? '生成中...' : '立即生成'}
            </button>
          </div>
        </aside>

        <main className="ecommerce-zone__content">
          <div className="ecommerce-zone__toolbar">
            <div className="ecommerce-zone__hero">
              <div className="ecommerce-zone__hero-logo">AI</div>
              <div>
                <div className="ecommerce-zone__hero-title">Hi，欢迎来到AI人物口播生成工具</div>
                <div className="ecommerce-zone__hero-subtitle">
                  上传参考图即可开始生成电商带货视频。
                </div>
              </div>
            </div>
          </div>

          <div className="ecommerce-zone__divider-row">
            <span />
            <div>
              {feedVideos[0] ? formatCreatedAtLabel(feedVideos[0].createdAt) : '等待生成第一条视频'}
            </div>
            <span />
          </div>

          <div className="ecommerce-zone__feed">
            <div className="ecommerce-zone__timeline-shell" ref={timelineScrollRef}>
              <GenerationTimeline
                items={timelineItems}
                pendingItems={pendingTimelineItems}
                bottomSafeSpace={24}
                credits={totalCredits}
                emptyDescription="右侧会展示已完成视频和生成中的任务卡片"
                generatingText="任务已提交，正在生成视频内容..."
                downloadText="下载视频"
                onDownload={handleDownload}
              />
              <div ref={timelineBottomRef} />
            </div>
          </div>

          <div className="ecommerce-zone__footer-note">
            内容由 AI
            生成，仅供参考。使用时请严格遵守相关法律规范对内容进行标识，并仅限本平台及关联平台内投放。
          </div>
        </main>
      </div>

      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={(images) => {
          /**
           * 关键逻辑：
           * 电商视频当前只保留 1 张人物参考图，
           * 智能生成提示词和视频提交都会直接复用这张图。
           */
          setSelectedImages(images.slice(0, 1));
          setSelectorVisible(false);
        }}
        maxCount={1}
        defaultImages={selectedImages}
        bizType="ecommerce"
      />
    </div>
  );
}
