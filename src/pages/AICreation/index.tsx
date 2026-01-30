import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  InputNumber,
  Select,
  message,
} from 'antd';
import {
  CopyOutlined,
  ArrowRightOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { generateNovelStream, generateScriptStream } from '@/api/ai';
import { useAICreationStore } from '@/stores/useAICreationStore';
import { useUserStore } from '@/stores/useUserStore';

const { TextArea } = Input;

function AICreation() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [novelForm] = Form.useForm();
  const [scriptForm] = Form.useForm();

  // 从 store 获取状态
  const {
    novelTheme,
    novelOutline,
    novelLength,
    novelResult,
    scriptNovel,
    scriptStyle,
    scriptResult,
    activeTab,
    setNovelTheme,
    setNovelOutline,
    setNovelLength,
    setNovelResult,
    setScriptNovel,
    setScriptStyle,
    setScriptResult,
    setActiveTab,
  } = useAICreationStore();

  const [novelLoading, setNovelLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);

  // 初始化表单值
  useEffect(() => {
    novelForm.setFieldsValue({
      theme: novelTheme,
      outline: novelOutline,
      length: novelLength,
    });
  }, [novelForm, novelTheme, novelOutline, novelLength]);

  useEffect(() => {
    scriptForm.setFieldsValue({
      novel: scriptNovel,
      style: scriptStyle,
    });
  }, [scriptForm, scriptNovel, scriptStyle]);

  // 生成小说（流式）
  const handleGenerateNovel = async (values: any) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setNovelLoading(true);
    setNovelResult(''); // 清空之前的结果

    let accumulatedText = '';

    try {
      await generateNovelStream(
        {
          theme: values.theme,
          outline: values.outline,
          length: values.length || 2000,
        },
        // onChunk: 处理每个数据块
        (content: string) => {
          accumulatedText += content;
          setNovelResult(accumulatedText);
        },
        // onError: 处理错误
        (error: string) => {
          message.error(error);
        },
        // onDone: 完成时的回调
        () => {
          message.success('小说生成成功');
        },
      );
    } catch (error: any) {
      message.error(error.message || '生成失败');
      console.error(error);
    } finally {
      setNovelLoading(false);
    }
  };

  // 复制小说
  const handleCopyNovel = () => {
    navigator.clipboard
      .writeText(novelResult)
      .then(() => {
        message.success('小说内容已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 生成剧本（流式）
  const handleGenerateScript = async (values: any) => {
    if (!currentUser) {
      message.error('请先登录');
      return;
    }

    setScriptLoading(true);
    setScriptResult(''); // 清空之前的结果

    let accumulatedText = '';

    try {
      await generateScriptStream(
        {
          novel: values.novel,
          style: values.style,
        },
        // onChunk: 处理每个数据块
        (content: string) => {
          accumulatedText += content;
          setScriptResult(accumulatedText);
        },
        // onError: 处理错误
        (error: string) => {
          message.error(error);
        },
        // onDone: 完成时的回调
        () => {
          message.success('剧本生成成功');
        },
      );
    } catch (error: any) {
      message.error(error.message || '生成失败');
      console.error(error);
    } finally {
      setScriptLoading(false);
    }
  };

  // 复制剧本
  const handleCopyScript = () => {
    navigator.clipboard
      .writeText(scriptResult)
      .then(() => {
        message.success('剧本内容已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  // 将小说转为剧本（切换标签页并填充）
  const handleNovelToScript = () => {
    if (!novelResult) {
      message.warning('请先生成小说');
      return;
    }

    // 切换到剧本生成标签页
    setActiveTab('script');

    // 填充小说内容到剧本表单
    setScriptNovel(novelResult);
    scriptForm.setFieldsValue({
      novel: novelResult,
    });

    message.success('已切换到剧本生成，小说内容已自动填充');
  };

  // 创建剧本（跳转到剧本管理并打开创建弹窗）
  const handleCreateScript = () => {
    if (!scriptResult) {
      message.warning('请先生成剧本');
      return;
    }

    // 获取表单的实际值
    const formValues = scriptForm.getFieldsValue();
    const currentStyle = formValues.style || scriptStyle;

    // 获取小说主题作为剧本标题
    const novelFormValues = novelForm.getFieldsValue();
    const novelThemeTitle = novelFormValues.theme || novelTheme;

    // 将剧本内容和相关信息保存到 localStorage
    localStorage.setItem('pendingScriptContent', scriptResult);
    localStorage.setItem('pendingScriptStyle', currentStyle);
    localStorage.setItem('pendingScriptTitle', novelThemeTitle);

    // 跳转到剧本管理页面
    navigate('/script-management');

    message.success('正在跳转到剧本管理...');
  };

  const tabItems = [
    {
      key: 'novel',
      label: '小说生成',
      children: (
        <div>
          <Form
            form={novelForm}
            layout="vertical"
            onFinish={handleGenerateNovel}
          >
            <Form.Item
              label="小说主题"
              name="theme"
              rules={[{ required: true, message: '请输入小说主题' }]}
            >
              <Input
                placeholder="例如：boss异能"
                onChange={(e) => setNovelTheme(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="小说大纲" name="outline">
              <TextArea
                rows={4}
                placeholder="可选，输入小说大纲"
                onChange={(e) => setNovelOutline(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="期望字数" name="length" initialValue={2000}>
              <InputNumber
                min={500}
                max={5000}
                step={500}
                style={{ width: '100%' }}
                onChange={(value) => setNovelLength(value || 2000)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={novelLoading}>
                {novelResult ? '重新生成小说' : '生成小说'}
              </Button>
              {novelResult && (
                <>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyNovel}
                    style={{ marginLeft: 8 }}
                  >
                    复制小说
                  </Button>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={handleNovelToScript}
                    style={{ marginLeft: 8 }}
                    disabled={novelLoading}
                  >
                    生成剧本
                  </Button>
                </>
              )}
            </Form.Item>
          </Form>
          {novelResult && (
            <Card title="生成结果" style={{ marginTop: 16 }}>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  maxHeight: 500,
                  overflow: 'auto',
                }}
              >
                {novelResult}
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'script',
      label: '剧本生成',
      children: (
        <div>
          <Form
            form={scriptForm}
            layout="vertical"
            onFinish={handleGenerateScript}
          >
            <Form.Item
              label="小说内容"
              name="novel"
              rules={[{ required: true, message: '请输入小说内容' }]}
            >
              <TextArea
                rows={8}
                placeholder="粘贴生成好的小说内容"
                onChange={(e) => setScriptNovel(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="剧本风格" name="style" initialValue="奇幻">
              <Select onChange={(value) => setScriptStyle(value)}>
                <Select.Option value="奇幻">奇幻</Select.Option>
                <Select.Option value="科幻">科幻</Select.Option>
                <Select.Option value="恋爱">恋爱</Select.Option>
                <Select.Option value="悬疑">悬疑</Select.Option>
                <Select.Option value="武侠">武侠</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={scriptLoading}>
                {scriptResult ? '重新生成剧本' : '生成剧本'}
              </Button>
              {scriptResult && (
                <>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopyScript}
                    style={{ marginLeft: 8 }}
                  >
                    复制剧本
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileAddOutlined />}
                    onClick={handleCreateScript}
                    style={{ marginLeft: 8 }}
                    disabled={scriptLoading}
                  >
                    创建剧本
                  </Button>
                </>
              )}
            </Form.Item>
          </Form>
          {scriptResult && (
            <Card title="生成结果" style={{ marginTop: 16 }}>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  maxHeight: 500,
                  overflow: 'auto',
                }}
              >
                {scriptResult}
              </div>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>AI创作</h2>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}

export default AICreation;
