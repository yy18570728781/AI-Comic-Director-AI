import { useState } from 'react';
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
import { CopyOutlined } from '@ant-design/icons';
import { generateNovel, generateScript } from '@/api/ai';

const { TextArea } = Input;

function AICreation() {
  const [activeTab, setActiveTab] = useState('novel');
  const [novelForm] = Form.useForm();
  const [scriptForm] = Form.useForm();
  const [novelLoading, setNovelLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [novelResult, setNovelResult] = useState('');
  const [scriptResult, setScriptResult] = useState('');

  // 生成小说
  const handleGenerateNovel = async (values: any) => {
    setNovelLoading(true);
    try {
      const res = await generateNovel({
        theme: values.theme,
        outline: values.outline,
        length: values.length || 2000,
        provider: 'deepseek',
      });
      setNovelResult(res.data.novel);
      message.success('小说生成成功');
    } catch (error) {
      console.error(error);
    } finally {
      setNovelLoading(false);
    }
  };

  // 复制小说
  const handleCopyNovel = () => {
    navigator.clipboard.writeText(novelResult);
    message.success('已复制到剪贴板');
  };

  // 生成剧本
  const handleGenerateScript = async (values: any) => {
    setScriptLoading(true);
    try {
      const res = await generateScript({
        novel: values.novel,
        style: values.style,
        provider: 'deepseek',
      });
      setScriptResult(res.data.script);
      message.success('剧本生成成功');
    } catch (error) {
      console.error(error);
    } finally {
      setScriptLoading(false);
    }
  };

  // 复制剧本
  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptResult);
    message.success('已复制到剪贴板');
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
              <Input placeholder="例如：boss异能" />
            </Form.Item>
            <Form.Item label="小说大纲" name="outline">
              <TextArea rows={4} placeholder="可选，输入小说大纲" />
            </Form.Item>
            <Form.Item label="期望字数" name="length" initialValue={2000}>
              <InputNumber
                min={500}
                max={5000}
                step={500}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={novelLoading}>
                生成小说
              </Button>
              {novelResult && (
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyNovel}
                  style={{ marginLeft: 8 }}
                >
                  复制小说
                </Button>
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
              <TextArea rows={8} placeholder="粘贴生成好的小说内容" />
            </Form.Item>
            <Form.Item label="剧本风格" name="style" initialValue="奇幻">
              <Select>
                <Select.Option value="奇幻">奇幻</Select.Option>
                <Select.Option value="科幻">科幻</Select.Option>
                <Select.Option value="恋爱">恋爱</Select.Option>
                <Select.Option value="悬疑">悬疑</Select.Option>
                <Select.Option value="武侠">武侠</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={scriptLoading}>
                生成剧本
              </Button>
              {scriptResult && (
                <Button
                  icon={<CopyOutlined />}
                  onClick={handleCopyScript}
                  style={{ marginLeft: 8 }}
                >
                  复制剧本
                </Button>
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
