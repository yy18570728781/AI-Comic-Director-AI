import React, { useState, useEffect } from 'react';
import { Button, Table, Space, Modal, Select, message, Card, Tag, Descriptions } from 'antd';
import { PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import { getScriptList, extractCharacters, batchSaveCharacters } from '../../api/script';
import { useNavigate } from 'react-router-dom';

interface ExtractedCharacter {
  name: string;
  description: string;
  appearance?: string;
  personality?: string;
  role?: string;
  scenes: string[];
  dialogueCount: number;
  imagePrompt?: string;
}

interface Script {
  id: number;
  title: string;
  content: string;
  style?: string;
  description?: string;
  shotCount: number;
  status: string;
  createdAt: string;
}

function CharacterLibrary() {
  const navigate = useNavigate();
  const [extractModalVisible, setExtractModalVisible] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<number | undefined>();
  const [extracting, setExtracting] = useState(false);
  const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  // 获取剧本列表
  const fetchScripts = async () => {
    try {
      const response = await getScriptList({
        page: 1,
        pageSize: 100, // 获取所有剧本用于选择
      });
      if (response.success) {
        setScripts(response.data.list || []);
      }
    } catch (error) {
      console.error('获取剧本列表失败:', error);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  // 开始提取角色
  const handleExtractCharacters = async () => {
    if (!selectedScript) {
      message.error('请选择一个剧本');
      return;
    }

    setExtracting(true);
    try {
      const response = await extractCharacters(selectedScript);
      if (response.success) {
        setExtractedCharacters(response.data.characters || []);
        setSelectedCharacters(response.data.characters?.map((c: ExtractedCharacter) => c.name) || []);
        message.success(`成功提取到 ${response.data.characters?.length || 0} 个角色`);
        
        // 提取完成后跳转到剧本详情页
        const script = response.data.script;
        if (script) {
          message.info('即将跳转到剧本详情页...');
          setTimeout(() => {
            navigate(`/script/${script.id}`);
          }, 2000);
        }
      } else {
        message.error(response.message || '提取角色失败');
      }
    } catch (error: any) {
      console.error('提取角色失败:', error);
      message.error('提取角色失败: ' + (error.message || '未知错误'));
    } finally {
      setExtracting(false);
    }
  };

  // 保存选中的角色到角色库
  const handleSaveCharacters = async () => {
    const charactersToSave = extractedCharacters.filter(c => 
      selectedCharacters.includes(c.name)
    );

    if (charactersToSave.length === 0) {
      message.error('请选择要保存的角色');
      return;
    }

    try {
      const response = await batchSaveCharacters(charactersToSave, 1); // TODO: 使用真实的userId
      if (response.success) {
        message.success(`成功保存 ${charactersToSave.length} 个角色到角色库`);
        setExtractModalVisible(false);
        setExtractedCharacters([]);
        setSelectedCharacters([]);
        setSelectedScript(undefined);
      } else {
        message.error(response.message || '保存角色失败');
      }
    } catch (error: any) {
      console.error('保存角色失败:', error);
      message.error('保存角色失败: ' + (error.message || '未知错误'));
    }
  };

  // 角色表格列定义
  const characterColumns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 300,
    },
    {
      title: '出现场景',
      dataIndex: 'scenes',
      key: 'scenes',
      render: (scenes: string[]) => (
        <div>
          {scenes.slice(0, 3).map((scene, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
              {scene}
            </Tag>
          ))}
          {scenes.length > 3 && <Tag color="default">+{scenes.length - 3}</Tag>}
        </div>
      ),
    },
    {
      title: '对话数量',
      dataIndex: 'dialogueCount',
      key: 'dialogueCount',
      width: 100,
      render: (count: number) => (
        <Tag color={count > 5 ? 'red' : count > 2 ? 'orange' : 'default'}>
          {count}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>角色库</h2>
        <Space>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={() => setExtractModalVisible(true)}
          >
            提取角色
          </Button>
          <Button icon={<PlusOutlined />}>
            手动添加角色
          </Button>
        </Space>
      </div>

      <div>
        <p>角色库功能开发中...</p>
        <p>点击右上角"提取角色"按钮从剧本中提取角色信息</p>
      </div>

      {/* 角色提取弹窗 */}
      <Modal
        title="从剧本提取角色"
        open={extractModalVisible}
        onCancel={() => {
          setExtractModalVisible(false);
          setExtractedCharacters([]);
          setSelectedCharacters([]);
          setSelectedScript(undefined);
        }}
        width={1000}
        footer={
          extractedCharacters.length > 0 ? [
            <Button key="cancel" onClick={() => setExtractModalVisible(false)}>
              取消
            </Button>,
            <Button 
              key="save" 
              type="primary" 
              onClick={handleSaveCharacters}
              disabled={selectedCharacters.length === 0}
            >
              保存选中角色到角色库 ({selectedCharacters.length})
            </Button>,
          ] : [
            <Button key="cancel" onClick={() => setExtractModalVisible(false)}>
              取消
            </Button>,
            <Button 
              key="extract" 
              type="primary" 
              loading={extracting}
              onClick={handleExtractCharacters}
              disabled={!selectedScript}
            >
              开始提取
            </Button>,
          ]
        }
      >
        {extractedCharacters.length === 0 ? (
          <div>
            <p style={{ marginBottom: '16px' }}>选择要提取角色的剧本：</p>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择剧本"
              value={selectedScript}
              onChange={setSelectedScript}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={scripts.map(script => ({
                value: script.id,
                label: `${script.title} (${script.shotCount}个分镜)`,
              }))}
            />
            {selectedScript && (
              <Card style={{ marginTop: '16px' }} size="small">
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="剧本标题">
                    {scripts.find(s => s.id === selectedScript)?.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="分镜数量">
                    {scripts.find(s => s.id === selectedScript)?.shotCount}
                  </Descriptions.Item>
                  <Descriptions.Item label="风格">
                    {scripts.find(s => s.id === selectedScript)?.style || '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={scripts.find(s => s.id === selectedScript)?.status === 'published' ? 'green' : 'orange'}>
                      {scripts.find(s => s.id === selectedScript)?.status}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <p>提取到 <strong>{extractedCharacters.length}</strong> 个角色，请选择要保存到角色库的角色：</p>
            </div>
            <Table
              dataSource={extractedCharacters}
              columns={characterColumns}
              rowKey="name"
              size="small"
              pagination={false}
              rowSelection={{
                selectedRowKeys: selectedCharacters,
                onChange: (selectedRowKeys) => {
                  setSelectedCharacters(selectedRowKeys as string[]);
                },
                onSelectAll: (selected) => {
                  if (selected) {
                    setSelectedCharacters(extractedCharacters.map(c => c.name));
                  } else {
                    setSelectedCharacters([]);
                  }
                },
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '8px 0' }}>
                    <Descriptions size="small" column={1}>
                      <Descriptions.Item label="详细描述">
                        {record.description}
                      </Descriptions.Item>
                      {record.appearance && (
                        <Descriptions.Item label="外观描述">
                          {record.appearance}
                        </Descriptions.Item>
                      )}
                      {record.scenes.length > 0 && (
                        <Descriptions.Item label="出现场景">
                          {record.scenes.join(', ')}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </div>
                ),
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default CharacterLibrary;