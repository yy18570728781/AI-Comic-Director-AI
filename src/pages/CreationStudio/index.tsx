import { useEffect, useMemo, useRef, useState } from 'react';
import { Select, message } from 'antd';
import GenerationComposer from '@/components/GenerationComposer';
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

interface ModelConfig {
  id: string;
  name: string;
  description: string;
  pricing?: {
    billingMode?: 'per_second' | 'per_video';
    pricingTiers?: Array<{
      resolution: string;
      creditsPerSecond: number;
    }>;
    perVideo?: {
      creditsPerVideo?: number;
    };
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

interface CreationVideoRecord extends GeneratedVideo {
  createdAt: string;
  prompt: string;
  modelName: string;
  resolution: string;
  ratio: string;
}

interface CreationPendingRecord {
  jobId: string | number;
  createdAt: string;
  prompt: string;
  resolution: string;
  ratio: string;
  duration: number;
  referenceImage?: string;
}

const COMPOSER_HEIGHT = 188;
const COMPOSER_BOTTOM_GAP = 24;
const CONTENT_SAFE_GAP = 28;
const CONTENT_BOTTOM_SAFE_SPACE = COMPOSER_HEIGHT + COMPOSER_BOTTOM_GAP + CONTENT_SAFE_GAP;

export default function CreationStudio() {
  const { videoModel, setVideoModel, videoModels, loadModels } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();
  const { tasks } = useTaskStore();

  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'female' | 'male'>('female');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<CreationVideoRecord[]>(
    () => storage.get<CreationVideoRecord[]>('creationStudio_generatedVideos', []) ?? []
  );
  const [pendingVideos, setPendingVideos] = useState<CreationPendingRecord[]>(
    () => storage.get<CreationPendingRecord[]>('creationStudio_pendingVideos', []) ?? []
  );
  const timelineBottomRef = useRef<HTMLDivElement | null>(null);

  const { generateVideo } = useAIGeneration({
    onVideoComplete: (video) => {
      const currentModel = models.find((item) => item.id === videoModel);

      /**
       * 这里把提交时的关键参数固化到历史记录里，
       * 避免结果回显时又去依赖当前表单值。
       */
      const nextRecord: CreationVideoRecord = {
        ...video,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
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
    storage.set('creationStudio_generatedVideos', generatedVideos);
  }, [generatedVideos]);

  useEffect(() => {
    storage.set('creationStudio_pendingVideos', pendingVideos);
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
     * 1. 创作工作台继续复用全局 task store 的真实轮询结果。
     * 2. 页面自己只维护用于回显的 pending 快照。
     * 3. 当全局视频队列里已经没有对应 jobId 时，就清理本地 pending 卡片。
     */
    const activeJobIds = new Set(
      tasks
        .filter((task) => task.type === 'video' && task.queueName === 'video')
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

  const timelineItems = useMemo<GenerationTimelineItem[]>(
    () =>
      generatedVideos.map((item) => ({
        id: item.id,
        type: GenerationTimelineItemType.VIDEO,
        createdAt: item.createdAt,
        requestText: item.prompt || '生成一段创作内容',
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
          { label: item.resolution },
          { label: item.ratio },
          { label: `${item.duration}s` },
        ],
      })),
    [pendingVideos]
  );

  useEffect(() => {
    /**
     * 刷新恢复任务和新增任务时都自动滚动到底部，
     * 保证用户总是看到最新一条结果或最新一张生成中卡片。
     */
    const timer = window.setTimeout(() => {
      timelineBottomRef.current?.scrollIntoView({
        block: 'end',
        behavior: 'smooth',
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingTimelineItems.length, timelineItems.length]);

  const handleGenerate = async () => {
    if (!selectedImages.length) {
      message.warning('请先选择参考图');
      return;
    }

    if (!prompt.trim()) {
      message.warning('请先填写生成描述');
      return;
    }

    if (isSubmitting) {
      message.warning('任务提交中，请稍候');
      return;
    }

    if (!isModeAvailable(selectedMode, selectedImages.length, supportedModes)) {
      message.error('当前模式和参考图数量不匹配');
      return;
    }

    if (!hasEnoughPoints) {
      message.warning('积分不足，暂时无法生成');
      return;
    }

    setIsSubmitting(true);

    try {
      for (let index = 0; index < batchCount; index += 1) {
        const jobId = await generateVideo({
          prompt: prompt.trim(),
          model: videoModel,
          mode: selectedMode as 't2v' | 'i2v' | 'flf2v' | 'ref2v',
          referenceImages: selectedImages,
          duration,
          resolution,
          ratio: aspectRatio,
          generateAudio,
          ...(saveToLibrary
            ? {
                saveToLibrary: true,
                /**
                 * 这里保留通用落库策略，方便后续业务页按需覆写。
                 */
                libraryName: `创作视频_${new Date().toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                libraryTags: [
                  '创作工作台',
                  '视频生成',
                  targetAudience === 'female' ? '女生' : '男生',
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
              prompt: prompt.trim(),
              resolution,
              ratio: aspectRatio,
              duration,
              referenceImage: selectedImages[0],
            },
          ]);
        }
      }
    } finally {
      window.setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `creation-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('视频已开始下载');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: `24px 24px ${CONTENT_BOTTOM_SAFE_SPACE}px`,
        background: '#f7f8fa',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div
          style={{
            minHeight: `calc(100vh - ${CONTENT_BOTTOM_SAFE_SPACE + 48}px)`,
            padding: '8px 0',
            overflowY: 'auto',
          }}
        >
          <GenerationTimeline
            items={timelineItems}
            pendingItems={pendingTimelineItems}
            bottomSafeSpace={CONTENT_BOTTOM_SAFE_SPACE}
            emptyDescription="这里先作为创作工作台的滚动展示区域"
            credits={totalCredits}
            generatingText="任务已提交，正在生成视频内容..."
            downloadText="下载视频"
            onDownload={handleDownload}
          />
          <div ref={timelineBottomRef} />
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 24,
          right: 24,
          bottom: 24,
          zIndex: 20,
        }}
      >
        <GenerationComposer
          prompt={prompt}
          onPromptChange={setPrompt}
          promptPlaceholder="输入文字，描述你想创作的视频内容，比如：一个玻璃香水瓶在柔光台面上缓慢旋转，镜头从近景推进到特写，突出通透质感和包装细节。"
          selectedImages={selectedImages}
          maxImageCount={maxImageCount}
          onOpenImageSelector={() => setSelectorVisible(true)}
          onRemoveImage={handleRemoveImage}
          modelValue={videoModel}
          modelOptions={modelOptions}
          onModelChange={handleModelChange}
          resolutionValue={resolution}
          resolutionOptions={resolutionOptions}
          onResolutionChange={(value) => setResolution(value)}
          aspectRatioValue={aspectRatio}
          aspectRatioOptions={aspectRatioOptions}
          onAspectRatioChange={(value) => setAspectRatio(value)}
          modeValue={selectedMode}
          modeOptions={modeOptions}
          onModeChange={(value) => setSelectedMode(value)}
          durationValue={duration}
          durationOptions={durationOptions}
          onDurationChange={(value) => setDuration(value)}
          batchCountValue={batchCount}
          batchCountMax={10}
          onBatchCountChange={(value) => setBatchCount(value)}
          saveToLibraryConfig={{
            checked: saveToLibrary,
            label: '存素材库',
            onChange: setSaveToLibrary,
          }}
          generateAudioConfig={{
            checked: generateAudio,
            label: '生成音频',
            onChange: setGenerateAudio,
          }}
          credits={totalCredits}
          currentPoints={currentUser?.points ?? 0}
          submitDisabled={loading || !hasEnoughPoints}
          submitLoading={isSubmitting}
          onSubmit={handleGenerate}
          extraConfigContent={
            <Select
              value={targetAudience}
              onChange={(value) => setTargetAudience(value)}
              variant="borderless"
              options={[
                { label: '女生', value: 'female' },
                { label: '男生', value: 'male' },
              ]}
              style={{
                minWidth: 86,
                height: 34,
                background: '#f7f8fa',
                borderRadius: 999,
              }}
            />
          }
          /**
           * 这里先保留模型选择。
           * 如果后面某个业务页固定成某一个模型：
           * 1. 页面层直接持有固定 model
           * 2. 这里改成 model: false
           * 3. 如果需要只读展示模型名，再传 modelFixedLabel
           */
          visibility={{
            model: true,
          }}
        />
      </div>

      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={(images) => {
          setSelectedImages(images);
          setSelectorVisible(false);
        }}
        maxCount={maxImageCount}
        defaultImages={selectedImages}
      />
    </div>
  );
}
