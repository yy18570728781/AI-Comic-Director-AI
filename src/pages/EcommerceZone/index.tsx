import { Card, Tag, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function EcommerceZone() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Card
        style={{
          borderRadius: 20,
          background:
            'linear-gradient(135deg, rgba(255,196,61,0.12), rgba(255,255,255,0.02))',
          border: '1px solid rgba(255,196,61,0.18)',
        }}
      >
        <Tag color="gold" style={{ marginBottom: 16 }}>
          新模块
        </Tag>
        <Title level={2} style={{ marginTop: 0 }}>
          电商专区
        </Title>
        <Paragraph style={{ fontSize: 16, marginBottom: 8 }}>
          这里会承接后续的电商场景能力，比如商品分析、卖点提炼、主图生成、详情图生成和带货素材编排。
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          当前先完成前端入口和独立模块页，后面我们再把对应的对话流程、提示词策略和生成能力接进来。
        </Paragraph>
      </Card>
    </div>
  );
}
