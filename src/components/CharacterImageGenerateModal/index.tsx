import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Form, Input } from 'antd';
import {
  PictureOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { generateImageAsync, optimizeImagePrompt } from '../../api/ai';
import { useTaskStore } from '../../stores/useTaskStore';
import { onTaskComplete } from '../GlobalTaskPoller';
import ReferenceImageSelector from '../ReferenceImageSelector';
import { useModelStore } from '../../stores/useModelStore';
import { useUserStore } from '../../stores/useUserStore';

const { TextArea } = Input;

interface CharacterImageActionsProps {
  character: any;
  onImageGenerated?: () => void;
}

/**
 * 角色图像操作组件
 * 使用异步队列接口生成角色图像
 */
export default function CharacterImageActions({
  character,
  onImageGenerated,
}: CharacterImageActionsProps) {
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | number | null>(null);

  // 获取全局选择的图像模型和用户信息
  const { imageModel } = useModelStore();
  const { currentUser } = useUserStore();
  const { addTask } = useTaskStore();

  // 监听任务完成事件
  useEffect(() => {
    if (!jobId) return;

    const unsubscribe = onTaskComplete((event) => {
      if (event.jobId === jobId) {
        message.success('角色图像生成完成！');
        setGenerating(false);
        setJobId(null);
        setGenerateModalVisible(false);
        onImageGenerated?.();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [jobId, onImageGenerated]);

  // 当弹窗打开时，初始化表单
  useEffect(() => {
    if (generateModalVisible && character) {
      const characterPrompt = `${character.name || '角色'}, ${character.description || ''}`;
      form.setFieldsValue({
        imagePrompt: characterPrompt,
      });
    }
  }, [generateModalVisible, character, form]);

  // AI 优化图像提示词
  const handleOptimizePrompt = async () => {
    const imagePrompt = form.getFieldValue('imagePrompt');

    if (!imagePrompt || !imagePrompt.trim()) {
      message.warning('请先填写图像提示词');
      return;
    }

    setOptimizing(true);
    try {
      const res = await optimizeImagePrompt({
        prompt: imagePrompt,
      });

      if (res.data?.optimized) {
        form.setFieldsValue({
          imagePrompt: res.data.optimized,
        });
        message.success('AI 优化完成！');
      }
    } catch (error: any) {
      console.error('AI 优化失败:', error);
      message.error(error.message || 'AI 优化失败，请重试');
    } finally {
      setOptimizing(false);
    }
  };

  // 生成角色图像（使用异步队列）
  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();

      if (!currentUser) {
        message.error('请先登录');
        return;
      }

      setGenerating(true);

      // 根据选择的模型设置合适的尺寸
      let width = 1024;
      let height = 1024;

      if (imageModel === 'doubao-seedream-4-5-251128') {
        width = 1920;
        height = 1920;
      }

      // 调用异步接口，保存到资源库
      const res = await generateImageAsync({
        prompt: values.imagePrompt,
        model: imageModel,
        width,
        height,
        referenceImages:
          referenceImages.length > 0 ? referenceImages : undefined,
        // 角色图像生成参数
        saveToLibrary: true,
        libraryName: `${character.name || '角色'}_生成图像_${Date.now()}`,
        libraryTags: ['角色图像', 'AI生成', character.name].filter(Boolean),
        userId: currentUser.id,
        scriptId: character.scriptId,
        characterId: character.id, // 传递角色ID用于更新角色库
      });

      if (res.success && res.data?.jobId) {
        setJobId(res.data.jobId);
        addTask({
          jobId: res.data.jobId,
          type: 'image',
        });
        message.info('角色图像生成任务已提交，正在生成中...');
      } else {
        throw new Error('提交任务失败');
      }
    } catch (error: any) {
      console.error('生成角色图像失败:', error);
      message.error(error.message || '生成角色图像失败');
      setGenerating(false);
    }
  };

  const handleUploadImage = () => {
    message.info('图像上传功能开发中...');
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          size="small"
          type="primary"
          icon={<PictureOutlined />}
          onClick={() => setGenerateModalVisible(true)}
        >
          生成图像
        </Button>
        <Button
          size="small"
          icon={<UploadOutlined />}
          onClick={handleUploadImage}
        >
          上传图像
        </Button>
      </div>

      {/* 角色图像生成弹窗 */}
      <Modal
        title={`生成角色图像 - ${character?.name || '未命名角色'}`}
        open={generateModalVisible}
        onCancel={() => {
          if (!generating) {
            setGenerateModalVisible(false);
            setReferenceImages([]);
            form.resetFields();
          }
        }}
        width={600}
        footer={[
          <Button
            key="cancel"
            onClick={() => setGenerateModalVisible(false)}
            disabled={generating}
          >
            取消
          </Button>,
          <Button
            key="generate"
            type="primary"
            icon={generating ? <LoadingOutlined /> : <PictureOutlined />}
            onClick={handleGenerate}
            loading={generating}
          >
            {generating ? '生成中...' : '生成角色图像'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色描述"
            name="imagePrompt"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="描述角色的外观、服装、表情等..."
              disabled={generating}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={handleOptimizePrompt}
              loading={optimizing}
              disabled={generating}
            >
              AI 优化提示词
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => setSelectorVisible(true)}
              disabled={generating}
            >
              选择参考图
            </Button>
            {referenceImages.length > 0 && (
              <span style={{ marginLeft: 8, color: '#1890ff' }}>
                已选择 {referenceImages.length} 张参考图
              </span>
            )}
          </div>

          {generating && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 4,
                textAlign: 'center',
              }}
            >
              <LoadingOutlined style={{ marginRight: 8 }} />
              正在生成角色图像，请稍候...
              {jobId && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  任务ID: {jobId}
                </div>
              )}
            </div>
          )}
        </Form>
      </Modal>

      {/* 参考图选择器 */}
      <ReferenceImageSelector
        visible={selectorVisible}
        onCancel={() => setSelectorVisible(false)}
        onConfirm={(images) => {
          setReferenceImages(images);
          setSelectorVisible(false);
        }}
        maxCount={2}
      />
    </>
  );
}
