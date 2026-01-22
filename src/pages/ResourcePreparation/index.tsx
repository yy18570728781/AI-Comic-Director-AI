import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Modal,
  Form,
  message,
  Empty,
  Spin,
  Space,
  Tag,
  Tabs,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  getProjectList,
  createProject,
  getProjectDetail,
  extractCharactersAndScenes,
  updateCharacter,
  updateScene,
} from '@/api/resource';

const { TextArea } = Input;

function ResourcePreparation() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [form] = Form.useForm();

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjectList({
        userId: 1,
        page: 1,
        pageSize: 20,
      });
      setProjects(res.data.list);
      if (res.data.list.length > 0 && !selectedProject) {
        loadProjectDetail(res.data.list[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载项目详情
  const loadProjectDetail = async (id: number) => {
    try {
      const res = await getProjectDetail(id);
      setSelectedProject(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // 创建项目
  const handleCreate = async (values: any) => {
    try {
      const res = await createProject({
        ...values,
        userId: 1,
      });
      message.success('项目创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadProjects();
      loadProjectDetail(res.data.id);
    } catch (error) {
      console.error(error);
    }
  };

  // AI提取角色和场景
  const handleExtract = async () => {
    if (!selectedProject) return;

    setExtractLoading(true);
    try {
      await extractCharactersAndScenes(selectedProject.id, {
        provider: 'deepseek',
      });
      message.success('提取成功');
      loadProjectDetail(selectedProject.id);
    } catch (error) {
      console.error(error);
    } finally {
      setExtractLoading(false);
    }
  };

  // 优化提示词
  const handleOptimizePrompt = (
    type: 'character' | 'scene',
    id: number,
    prompt: string,
  ) => {
    message.info('AI优化提示词功能开发中');
  };

  // 生成图像
  const handleGenerateImage = (type: 'character' | 'scene', id: number) => {
    message.info('生成图像功能开发中');
  };

  // 生成单角色视频
  const handleGenerateVideo = (characterId: number) => {
    message.info('生成单角色视频功能开发中');
  };

  // 保存到资源库
  const handleSaveToLibrary = (type: 'character' | 'scene', item: any) => {
    message.info('保存到资源库功能开发中');
  };

  const tabItems = [
    {
      key: 'characters',
      label: (
        <span>
          角色{' '}
          {selectedProject?.characters?.length > 0 && (
            <Tag color="blue">{selectedProject.characters.length}</Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {!selectedProject?.characters ||
          selectedProject.characters.length === 0 ? (
            <Empty description="还没有提取角色" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {selectedProject.characters.map((char: any) => (
                <Card
                  key={char.id}
                  title={char.name}
                  extra={
                    <Space>
                      <Button
                        size="small"
                        icon={<ThunderboltOutlined />}
                        onClick={() =>
                          handleOptimizePrompt(
                            'character',
                            char.id,
                            char.prompt,
                          )
                        }
                      >
                        AI优化
                      </Button>
                      <Button
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() =>
                          handleGenerateImage('character', char.id)
                        }
                      >
                        生成图像
                      </Button>
                      <Button
                        size="small"
                        icon={<VideoCameraOutlined />}
                        onClick={() => handleGenerateVideo(char.id)}
                      >
                        生成视频
                      </Button>
                      <Button
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={() => handleSaveToLibrary('character', char)}
                      >
                        保存资源库
                      </Button>
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>描述：</strong>
                    <div style={{ marginTop: 4, color: '#666' }}>
                      {char.description}
                    </div>
                  </div>
                  {char.prompt && (
                    <div>
                      <strong>提示词：</strong>
                      <div
                        style={{ marginTop: 4, color: '#1890ff', fontSize: 12 }}
                      >
                        {char.prompt}
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
      key: 'scenes',
      label: (
        <span>
          场景{' '}
          {selectedProject?.scenes?.length > 0 && (
            <Tag color="green">{selectedProject.scenes.length}</Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {!selectedProject?.scenes || selectedProject.scenes.length === 0 ? (
            <Empty description="还没有提取场景" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {selectedProject.scenes.map((scene: any) => (
                <Card
                  key={scene.id}
                  title={scene.name}
                  extra={
                    <Space>
                      <Button
                        size="small"
                        icon={<ThunderboltOutlined />}
                        onClick={() =>
                          handleOptimizePrompt('scene', scene.id, scene.prompt)
                        }
                      >
                        AI优化
                      </Button>
                      <Button
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() => handleGenerateImage('scene', scene.id)}
                      >
                        生成图像
                      </Button>
                      <Button
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={() => handleSaveToLibrary('scene', scene)}
                      >
                        保存资源库
                      </Button>
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>描述：</strong>
                    <div style={{ marginTop: 4, color: '#666' }}>
                      {scene.description}
                    </div>
                  </div>
                  {scene.prompt && (
                    <div>
                      <strong>提示词：</strong>
                      <div
                        style={{ marginTop: 4, color: '#52c41a', fontSize: 12 }}
                      >
                        {scene.prompt}
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
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <span>项目：</span>
          {projects.map((project) => (
            <Button
              key={project.id}
              type={selectedProject?.id === project.id ? 'primary' : 'default'}
              onClick={() => loadProjectDetail(project.id)}
            >
              {project.name}
            </Button>
          ))}
        </Space>
        <Space>
          {selectedProject &&
            (!selectedProject.characters ||
              selectedProject.characters.length === 0) && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleExtract}
                loading={extractLoading}
              >
                AI提取角色和场景
              </Button>
            )}
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建项目
          </Button>
        </Space>
      </div>

      {selectedProject ? (
        <Tabs items={tabItems} />
      ) : (
        <Card>
          <Empty description="请先创建一个资源准备项目" />
        </Card>
      )}

      {/* 创建项目弹窗 */}
      <Modal
        title="创建资源准备项目"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="项目名称"
            name="name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="例如：boss异能" />
          </Form.Item>
          <Form.Item
            label="剧本内容"
            name="scriptContent"
            rules={[{ required: true, message: '请输入剧本内容' }]}
          >
            <TextArea
              rows={10}
              placeholder="粘贴剧本内容，AI将自动提取角色和场景"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ResourcePreparation;
