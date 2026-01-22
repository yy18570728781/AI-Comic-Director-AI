import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
  Space,
  Modal,
  Tag,
  Empty,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  getScriptDetail,
  generateStoryboard,
  updateShot,
  deleteShot,
} from '@/api/script';

const { TextArea } = Input;

function ScriptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('script');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [editingShotId, setEditingShotId] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  // 加载剧本详情
  const loadScript = async () => {
    setLoading(true);
    try {
      const res = await getScriptDetail(parseInt(id!));
      setScript(res.data);
    } catch (error) {
      console.error(error);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScript();
  }, [id]);

  // 生成分镜脚本
  const handleGenerateStoryboard = async () => {
    setGenerateLoading(true);
    try {
      await generateStoryboard(parseInt(id!), {
        provider: 'deepseek',
        shotCount: 30,
      });
      message.success('分镜脚本生成成功');
      loadScript();
      setActiveTab('shots');
    } catch (error) {
      console.error(error);
    } finally {
      setGenerateLoading(false);
    }
  };

  // 编辑分镜
  const handleEditShot = (shot: any) => {
    setEditingShotId(shot.id);
    editForm.setFieldsValue({
      scene: shot.scene,
      characters: shot.characters?.join(', '),
      dialogue: shot.dialogue,
      visualDescription: shot.visualDescription,
      imagePrompt: shot.imagePrompt,
      videoPrompt: shot.videoPrompt,
      shotType: shot.shotType,
      duration: shot.duration,
    });
  };

  // 保存分镜编辑
  const handleSaveShot = async (values: any) => {
    try {
      await updateShot(editingShotId!, {
        ...values,
        characters: values.characters
          ?.split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      });
      message.success('保存成功');
      setEditingShotId(null);
      editForm.resetFields();
      loadScript();
    } catch (error) {
      console.error(error);
    }
  };

  // 删除分镜
  const handleDeleteShot = async (shotId: number) => {
    try {
      await deleteShot(shotId);
      message.success('删除成功');
      loadScript();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <Spin spinning style={{ marginTop: 100 }} />;
  }

  if (!script) {
    return <Empty description="剧本不存在" />;
  }

  const tabItems = [
    {
      key: 'script',
      label: '剧本',
      children: (
        <Card>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {script.content}
          </div>
        </Card>
      ),
    },
    {
      key: 'shots',
      label: (
        <span>
          分镜{' '}
          {script.shots?.length > 0 && (
            <Tag color="blue">{script.shots.length}</Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {!script.shots || script.shots.length === 0 ? (
            <Card>
              <Empty
                description="还没有生成分镜脚本"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={handleGenerateStoryboard}
                  loading={generateLoading}
                >
                  生成分镜脚本
                </Button>
              </Empty>
            </Card>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {script.shots.map((shot: any) => (
                <Card
                  key={shot.id}
                  title={
                    <Space>
                      <Tag color="green">镜头 #{shot.shotNumber}</Tag>
                      {shot.scene && <span>{shot.scene}</span>}
                      {shot.shotType && <Tag>{shot.shotType}</Tag>}
                      {shot.duration && (
                        <Tag color="blue">{shot.duration}秒</Tag>
                      )}
                    </Space>
                  }
                  extra={
                    <Space>
                      <Button
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() => message.info('图像生成功能开发中')}
                      >
                        生成图像
                      </Button>
                      <Button
                        size="small"
                        icon={<VideoCameraOutlined />}
                        onClick={() => message.info('视频生成功能开发中')}
                      >
                        生成视频
                      </Button>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditShot(shot)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定删除这个分镜吗？"
                        onConfirm={() => handleDeleteShot(shot.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  }
                >
                  {shot.characters && shot.characters.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>角色：</strong>
                      {shot.characters.map((char: string, idx: number) => (
                        <Tag key={idx} color="purple">
                          {char}
                        </Tag>
                      ))}
                    </div>
                  )}
                  {shot.dialogue && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>对白：</strong>
                      <div style={{ marginTop: 4, color: '#666' }}>
                        {shot.dialogue}
                      </div>
                    </div>
                  )}
                  {shot.visualDescription && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>画面描述：</strong>
                      <div style={{ marginTop: 4, color: '#666' }}>
                        {shot.visualDescription}
                      </div>
                    </div>
                  )}
                  {shot.imagePrompt && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>图像提示词：</strong>
                      <div
                        style={{ marginTop: 4, color: '#1890ff', fontSize: 12 }}
                      >
                        {shot.imagePrompt}
                      </div>
                    </div>
                  )}
                  {shot.videoPrompt && (
                    <div>
                      <strong>视频提示词：</strong>
                      <div
                        style={{
                          marginTop: 4,
                          color: '#52c41a',
                          fontSize: 12,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {shot.videoPrompt}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </Space>
          )}
        </div>
      ),
    },
    {
      key: 'images',
      label: '图像',
      children: (
        <Card>
          <Empty description="图像功能开发中" />
        </Card>
      ),
    },
    {
      key: 'videos',
      label: '视频',
      children: (
        <Card>
          <Empty description="视频功能开发中" />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/script-management')}
          >
            返回
          </Button>
          <h2 style={{ margin: 0 }}>{script.title}</h2>
          {script.style && <Tag color="blue">{script.style}</Tag>}
        </Space>
        {activeTab === 'script' && script.shots?.length === 0 && (
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerateStoryboard}
            loading={generateLoading}
          >
            生成分镜脚本
          </Button>
        )}
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 编辑分镜弹窗 */}
      <Modal
        title="编辑分镜"
        open={editingShotId !== null}
        onCancel={() => {
          setEditingShotId(null);
          editForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveShot}>
          <Form.Item label="场景" name="scene">
            <Input placeholder="例如：城堡大厅" />
          </Form.Item>
          <Form.Item label="角色" name="characters">
            <Input placeholder="多个角色用逗号分隔，例如：#id:ABC123 诺士英, 沉默" />
          </Form.Item>
          <Form.Item label="对白" name="dialogue">
            <TextArea rows={2} placeholder="角色对白" />
          </Form.Item>
          <Form.Item label="画面描述" name="visualDescription">
            <TextArea rows={3} placeholder="详细描述画面内容" />
          </Form.Item>
          <Form.Item label="图像提示词" name="imagePrompt">
            <TextArea rows={3} placeholder="用于生成图像的提示词（英文）" />
          </Form.Item>
          <Form.Item label="视频提示词" name="videoPrompt">
            <TextArea rows={4} placeholder="时间轴格式的视频提示词" />
          </Form.Item>
          <Space>
            <Form.Item
              label="镜头类型"
              name="shotType"
              style={{ marginBottom: 0 }}
            >
              <Select style={{ width: 120 }}>
                <Select.Option value="特写">特写</Select.Option>
                <Select.Option value="近景">近景</Select.Option>
                <Select.Option value="中景">中景</Select.Option>
                <Select.Option value="全景">全景</Select.Option>
                <Select.Option value="远景">远景</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="时长(秒)"
              name="duration"
              style={{ marginBottom: 0 }}
            >
              <InputNumber min={1} max={30} />
            </Form.Item>
          </Space>
          <Form.Item style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setEditingShotId(null)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ScriptDetail;
