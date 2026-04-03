import { useEffect, useMemo, useState } from 'react';
import { Input, InputNumber, Select, Switch, message } from 'antd';
import {
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { useModelStore } from '@/stores/useModelStore';
import { useUserStore } from '@/stores/useUserStore';
import { useAIGeneration, GeneratedVideo } from '@/hooks/useAIGeneration';
import useVideoComposer from '@/hooks/useVideoComposer';
import ReferenceImageSelector from '@/components/ReferenceImageSelector';
import GenerationTimeline, {
  GenerationTimelineItem,
  GenerationTimelineItemType,
} from '@/components/GenerationTimeline';
import { storage } from '@/utils';
import { isModeAvailable } from '@/pages/ImageToVideo/config';
import './style.css';

const { TextArea } = Input;

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

const DEMO_TEMPLATE_CARDS = ['轻奢穿搭', '护肤种草', '甜美推荐', '潮流开箱'];

function formatCreatedAtLabel(value?: string) {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return `${date.getFullYear()}年${`${date.getMonth() + 1}`.padStart(2, '0')}月${`${date.getDate()}`.padStart(2, '0')}日 ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

export default function EcommerceZone() {
  const { videoModel, setVideoModel, videoModels, loadModels } = useModelStore();
  const { currentUser, refreshPoints } = useUserStore();
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [targetGender, setTargetGender] = useState<'female' | 'male'>('female');
  const [activeRoleTab, setActiveRoleTab] = useState<'character' | 'voice'>('character');
  const [motionPrompt, setMotionPrompt] = useState('');
  const [loadingPlaceholders, setLoadingPlaceholders] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<EcommerceVideoRecord[]>(
    () => storage.get<EcommerceVideoRecord[]>('ecommerceZone_generatedVideos', []) ?? []
  );

  const { generateVideo } = useAIGeneration({
    onVideoComplete: (video) => {
      const currentModel = models.find((item) => item.id === videoModel);
      // 关键逻辑：把页面里的两个描述输入框合并后固化到历史记录里，避免回显依赖当前表单状态。
      const finalPrompt = [prompt.trim(), motionPrompt.trim()].filter(Boolean).join('；');
      const nextRecord: EcommerceVideoRecord = {
        ...video,
        createdAt: new Date().toISOString(),
        prompt: finalPrompt || prompt.trim(),
        modelName: currentModel?.name || videoModel,
        resolution,
        ratio: aspectRatio,
      };
      setGeneratedVideos((prev) => [...prev, nextRecord]);
      setLoadingPlaceholders((prev) => Math.max(0, prev - 1));
      refreshPoints();
    },
    onError: () => setLoadingPlaceholders((prev) => Math.max(0, prev - 1)),
    showMessage: true,
  });

  useEffect(() => {
    storage.set('ecommerceZone_generatedVideos', generatedVideos);
  }, [generatedVideos]);

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

  const { fields, derived, actions } = useVideoComposer({
    models,
    selectedModelId: videoModel,
    onModelChange: setVideoModel,
    currentPoints: currentUser?.points ?? 0,
  });

  const { selectedImages, prompt, duration, resolution, aspectRatio, batchCount, selectedMode, saveToLibrary, generateAudio } = fields;
  const { supportedModes, maxImageCount, durationOptions, modelOptions, resolutionOptions, aspectRatioOptions, modeOptions, totalCredits, hasEnoughPoints } = derived;
  const { setSelectedImages, setPrompt, setDuration, setResolution, setAspectRatio, setBatchCount, setSelectedMode, setSaveToLibrary, setGenerateAudio, handleModelChange } = actions;

  const currentModelName = useMemo(
    () => modelOptions.find((item) => item.value === videoModel)?.label || videoModel || '视频模型',
    [modelOptions, videoModel]
  );
  const feedVideos = useMemo(() => [...generatedVideos].reverse(), [generatedVideos]);
  const timelineItems = useMemo<GenerationTimelineItem[]>(
    () =>
      generatedVideos.map((item) => ({
        id: item.id,
        type: GenerationTimelineItemType.VIDEO,
        createdAt: item.createdAt,
        requestText: item.prompt || '生成一段电商内容',
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

  const handleGenerate = async () => {
    if (!selectedImages.length) return message.warning('请先选择商品参考图');
    if (!prompt.trim()) return message.warning('请先填写说话内容');
    if (isSubmitting) return message.warning('任务提交中，请稍候');
    if (!isModeAvailable(selectedMode, selectedImages.length, supportedModes)) {
      return message.error('当前模式和参考图数量不匹配');
    }
    if (!hasEnoughPoints) return message.warning('积分不足，暂时无法生成');

    // 关键逻辑：新模块自己的“说话内容 + 动作描述”在提交前统一拼成最终 prompt。
    const finalPrompt = [prompt.trim(), motionPrompt.trim()].filter(Boolean).join('；');
    setIsSubmitting(true);
    try {
      setLoadingPlaceholders((prev) => prev + batchCount);
      for (let index = 0; index < batchCount; index += 1) {
        await generateVideo({
          prompt: finalPrompt,
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
                libraryName: `电商视频_${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
                libraryTags: ['电商专区', '视频生成', targetGender === 'female' ? '女生' : '男生'],
              }
            : {}),
        });
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

  return (
    <div className="ecommerce-zone">
      <div className="ecommerce-zone__frame">
        <aside className="ecommerce-zone__sidebar">
          <div className="ecommerce-zone__sidebar-top">
            <div className="ecommerce-zone__sidebar-title">配音生视频</div>
            <Select value={videoModel} onChange={(value) => handleModelChange(String(value))} options={modelOptions} variant="borderless" className="ecommerce-zone__model-select" />
          </div>

          <div className="ecommerce-zone__sidebar-card">
            <div className="ecommerce-zone__role-switch">
              <button type="button" className={`ecommerce-zone__role-button ${activeRoleTab === 'character' ? 'is-active' : ''}`} onClick={() => setActiveRoleTab('character')}>
                <UserOutlined />
                <span>人物</span>
              </button>
              <button type="button" className={`ecommerce-zone__role-button ${activeRoleTab === 'voice' ? 'is-active' : ''}`} onClick={() => setActiveRoleTab('voice')}>
                <VideoCameraOutlined />
                <span>音色</span>
              </button>
            </div>

            <div className="ecommerce-zone__field-group">
              <label className="ecommerce-zone__field-label">说话内容</label>
              <TextArea value={prompt} onChange={(event) => setPrompt(event.target.value)} autoSize={{ minRows: 3, maxRows: 5 }} variant="borderless" placeholder="请输入你希望角色说出的活泼点击口播文案" className="ecommerce-zone__textarea" />
            </div>

            <div className="ecommerce-zone__field-group">
              <label className="ecommerce-zone__field-label">动作描述（可选）</label>
              <TextArea value={motionPrompt} onChange={(event) => setMotionPrompt(event.target.value)} autoSize={{ minRows: 2, maxRows: 4 }} variant="borderless" placeholder="请描述你想生成的画面和动作" className="ecommerce-zone__textarea" />
            </div>

            <div className="ecommerce-zone__visual-panel">
              <div className="ecommerce-zone__visual-grid">
                <button type="button" className="ecommerce-zone__image-picker" onClick={() => setSelectorVisible(true)}>
                  <span className="ecommerce-zone__image-picker-icon"><PlusOutlined /></span>
                  <span>参考图</span>
                </button>
                <div className="ecommerce-zone__visual-copy">输入文字，描述你想创作的电商视频内容，比如：一个护肤品瓶身在柔光台面上缓慢旋转，突出通透质感和高级包装。</div>
              </div>

              <div className="ecommerce-zone__preview-strip">
                <button type="button" className="ecommerce-zone__preview-add" onClick={() => setSelectorVisible(true)}>
                  <PlusOutlined />
                  <span>{selectedImages.length ? '重选' : '添加'}</span>
                </button>
                <div className="ecommerce-zone__preview-meta">
                  <span>{currentModelName}</span>
                  <span>{resolution}</span>
                  <span>{aspectRatio}</span>
                </div>
              </div>

              <div className="ecommerce-zone__config-list">
                <div className="ecommerce-zone__config-pill"><span>目标人群</span><Select value={targetGender} onChange={(value) => setTargetGender(value)} options={[{ label: '女生', value: 'female' }, { label: '男生', value: 'male' }]} variant="borderless" className="ecommerce-zone__pill-select" /></div>
                <div className="ecommerce-zone__config-pill"><span>模式</span><Select value={selectedMode} onChange={(value) => setSelectedMode(String(value))} options={modeOptions} variant="borderless" className="ecommerce-zone__pill-select" /></div>
                <div className="ecommerce-zone__config-pill"><span>分辨率</span><Select value={resolution} onChange={(value) => setResolution(String(value))} options={resolutionOptions} variant="borderless" className="ecommerce-zone__pill-select" /></div>
                <div className="ecommerce-zone__config-pill"><span>比例</span><Select value={aspectRatio} onChange={(value) => setAspectRatio(String(value))} options={aspectRatioOptions} variant="borderless" className="ecommerce-zone__pill-select" /></div>
                <div className="ecommerce-zone__config-pill"><span>时长</span><Select value={duration} onChange={(value) => setDuration(Number(value))} options={durationOptions.map((option) => ({ label: `${option}s`, value: option }))} variant="borderless" className="ecommerce-zone__pill-select" /></div>
                <div className="ecommerce-zone__config-pill"><span>份数</span><InputNumber min={1} max={10} value={batchCount} onChange={(value) => setBatchCount(Number(value) || 1)} controls={false} variant="borderless" className="ecommerce-zone__pill-number" /></div>
                <label className="ecommerce-zone__switch-row"><Switch size="small" checked={saveToLibrary} onChange={setSaveToLibrary} /><span>存素材库</span></label>
                <label className="ecommerce-zone__switch-row"><Switch size="small" checked={generateAudio} onChange={setGenerateAudio} /><span>生成音频</span></label>
              </div>

              <div className="ecommerce-zone__status-row">
                <span><PictureOutlined /> {selectedImages.length}/{maxImageCount} 图</span>
                <span>{totalCredits} 积分</span>
              </div>
              <div className="ecommerce-zone__current-points">当前积分 {currentUser?.points ?? 0}</div>
            </div>

            <div className="ecommerce-zone__template-head"><span>不知道怎么写？试试动作提示词</span><span>隐藏</span></div>
            <div className="ecommerce-zone__template-list">
              {DEMO_TEMPLATE_CARDS.map((item) => (
                <button key={item} type="button" className="ecommerce-zone__template-card" onClick={() => setMotionPrompt(`${item}，镜头平稳推进，人物自然展示商品`)}>
                  <span className="ecommerce-zone__template-cover" />
                  <span className="ecommerce-zone__template-name">{item}</span>
                </button>
              ))}
              <button type="button" className="ecommerce-zone__template-more">更多</button>
            </div>

            <button type="button" className="ecommerce-zone__submit" onClick={handleGenerate} disabled={loading || isSubmitting || !hasEnoughPoints}>
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
                <div className="ecommerce-zone__hero-subtitle">选择合适的生成方式，上传素材即可生成。支持切换不同模型，轻松打造电商短视频。</div>
              </div>
            </div>
            <button type="button" className="ecommerce-zone__upload-button"><UploadOutlined /><span>拖拽至此上传</span></button>
            <div className="ecommerce-zone__toolbar-actions">
              <button type="button" className="ecommerce-zone__toolbar-button"><SettingOutlined /><span>设置</span></button>
              <button type="button" className="ecommerce-zone__toolbar-button"><LinkOutlined /><span>管理视频原料</span></button>
              <button type="button" className="ecommerce-zone__toolbar-button"><SearchOutlined /><span>任务搜索</span></button>
            </div>
          </div>

          <div className="ecommerce-zone__divider-row"><span /><div>{feedVideos[0] ? formatCreatedAtLabel(feedVideos[0].createdAt) : '等待生成第一条视频'}</div><span /></div>

          <div className="ecommerce-zone__feed">
            <div className="ecommerce-zone__timeline-shell">
              <GenerationTimeline
                items={timelineItems}
                loadingPlaceholders={loadingPlaceholders}
                bottomSafeSpace={24}
                credits={totalCredits}
                emptyDescription="右侧先复用统一结果流，后续再按电商专区做细节增强"
                generatingText="任务已提交，正在生成视频内容..."
                downloadText="下载视频"
                onDownload={handleDownload}
              />
            </div>
          </div>

          <div className="ecommerce-zone__footer-note">内容由AI生成，仅供参考。使用时请严格遵守相关法律规范对内容进行标识，并仅限本平台及关联平台内投放。</div>
        </main>
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
