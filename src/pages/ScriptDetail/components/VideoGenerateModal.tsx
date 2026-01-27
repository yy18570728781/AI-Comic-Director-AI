import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, message, Select } from 'antd';
import { ThunderboltOutlined, SyncOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface VideoGenerateModalProps {
  visible: boolean;
  shot: any;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (config: any) => void;
}

/**
 * 视频生成配置弹窗
 */
export default function VideoGenerateModal({
  visible,
  shot,
  loading = false,
  onCancel,
  onSubmit,
}: VideoGenerateModalProps) {
  const [form] = Form.useForm();
  const [optimizing, setOptimizing] = useState(false);

  // 当弹窗打开时，初始化表单
  useEffect(() => {
    if (visible && shot) {
      form.setFieldsValue({
        videoPrompt: shot.videoPrompt || shot.visualDescription || '',
        model: 'wan2.6-i2v-flash',
        duration: 5,
      });
    }
  }, [visible, shot, form]);

  // AI 优化视频提示词
  const handleOptimizePrompt = async () => {
    const videoPrompt = form.getFieldValue('videoPrompt');
    if (!videoPrompt) {
      message.warning('请先输入视频提示词');
      return;
    }

    setOptimizing(true);
    try {
      const { optimizeVideoPrompt } = await import('@/api/ai');
      const res = await optimizeVideoPrompt(videoPrompt);

      if (res.success && res.data.optimized) {
        form.setFieldsValue({
          videoPrompt: res.data.optimized,
        });
        message.success('提示词优化成功');
      } else {
        message.error(res.message || '优化失败');
      }
    } catch (error: any) {
      console.error('优化提示词失败:', error);
      message.error('优化失败');
    } finally {
      setOptimizing(false);
    }
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  // 获取首帧和尾帧
  const firstFrame = shot?.images?.find((img: any) => img.isFirstFrame);
  const lastFrame = shot?.images?.find((img: any) => img.isLastFrame);

  return (
    <Modal
      title={`生成视频 - 镜头 #${shot?.shotNumber || ''}`}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<ThunderboltOutlined />}
        >
          生成视频
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        {/* 首帧和尾帧预览 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
            参考帧
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {/* 首帧 */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 4,
                }}
              >
                首帧 {!firstFrame && '(未设置)'}
              </div>
              {firstFrame ? (
                <img
                  src={firstFrame.url}
                  alt="首帧"
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '2px solid #faad14',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 150,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                  }}
                >
                  未设置首帧
                </div>
              )}
            </div>

            {/* 尾帧 */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#999',
                  marginBottom: 4,
                }}
              >
                尾帧 {lastFrame ? '(已设置)' : '(可选)'}
              </div>
              {lastFrame ? (
                <img
                  src={lastFrame.url}
                  alt="尾帧"
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: 4,
                    border: '2px solid #1890ff',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: 150,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                  }}
                >
                  未设置尾帧
                  <br />
                  (将使用单图生成)
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#999',
            }}
          >
            {lastFrame
              ? '✅ 将使用首尾帧生成视频（更精确控制）'
              : 'ℹ️ 将使用单图（首帧）生成视频'}
          </div>
        </div>

        {/* 视频提示词 */}
        <Form.Item
          label={
            <Space>
              <span>视频提示词</span>
              <Button
                type="link"
                size="small"
                icon={<SyncOutlined spin={optimizing} />}
                onClick={handleOptimizePrompt}
                loading={optimizing}
                style={{ padding: 0, height: 'auto' }}
              >
                AI 优化
              </Button>
            </Space>
          }
          name="videoPrompt"
          rules={[{ required: true, message: '请输入视频提示词' }]}
        >
          <TextArea
            rows={6}
            placeholder="描述视频中的动作、运镜、氛围等&#10;例如：镜头缓缓推进，角色转身看向远方，背景光线逐渐变暗"
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* 模型选择 */}
        <Form.Item
          label="视频模型"
          name="model"
          rules={[{ required: true, message: '请选择视频模型' }]}
        >
          <Select>
            <Select.Option value="wan2.6-i2v-flash">
              通义万相 2.6 (图生视频-快速)
            </Select.Option>
          </Select>
        </Form.Item>

        {/* 视频时长 */}
        <Form.Item
          label="视频时长"
          name="duration"
          rules={[{ required: true, message: '请选择视频时长' }]}
        >
          <Select>
            <Select.Option value={5}>5秒</Select.Option>
            <Select.Option value={10}>10秒</Select.Option>
          </Select>
        </Form.Item>

        <div
          style={{
            padding: 12,
            backgroundColor: '#f0f7ff',
            borderRadius: 4,
            fontSize: 12,
            color: '#666',
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: 4 }}>💡 提示</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>视频生成需要 1-2 分钟，请耐心等待</li>
            <li>提示词越详细，生成效果越好</li>
            <li>建议使用 AI 优化功能优化提示词</li>
            <li>设置尾帧可以更精确控制视频结束画面</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
}
