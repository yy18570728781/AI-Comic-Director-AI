import { useState } from 'react'
import { Button, message, Modal, Progress, Typography } from 'antd'
import { LinkOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { bindCharactersForScript } from '@/api/script'

const { Text, Title } = Typography

interface AutoBindingButtonProps {
  scriptId: number
  onBindingComplete?: (result: any) => void
  onBindingError?: (error: string) => void
}

interface BindingResult {
  scriptId: number
  processedShots: number
  totalBoundCharacters: number
  totalUnboundCharacters: number
  shotResults: Array<{
    shotId: number
    boundCharacters: Array<{
      characterName: string
      imageUrl: string
      resourceId: number
      bindingTimestamp: string
    }>
    unboundCharacters: string[]
    totalProcessed: number
  }>
}

function AutoBindingButton({ scriptId, onBindingComplete, onBindingError }: AutoBindingButtonProps) {
  const [loading, setLoading] = useState(false)
  const [resultModalVisible, setResultModalVisible] = useState(false)
  const [bindingResult, setBindingResult] = useState<BindingResult | null>(null)

  const handleBindCharacters = async () => {
    setLoading(true)
    try {
      const response = await bindCharactersForScript(scriptId)
      
      if (response.success) {
        const result = response.data as BindingResult
        setBindingResult(result)
        setResultModalVisible(true)
        
        message.success(`成功绑定 ${result.totalBoundCharacters} 个角色`)
        onBindingComplete?.(result)
      } else {
        const errorMsg = response.message || '角色绑定失败'
        message.error(errorMsg)
        onBindingError?.(errorMsg)
      }
    } catch (error: any) {
      console.error('角色绑定失败:', error)
      const errorMsg = error.message || '角色绑定失败'
      message.error(errorMsg)
      onBindingError?.(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const renderResultModal = () => {
    if (!bindingResult) return null

    const successRate = bindingResult.totalBoundCharacters + bindingResult.totalUnboundCharacters > 0
      ? (bindingResult.totalBoundCharacters / (bindingResult.totalBoundCharacters + bindingResult.totalUnboundCharacters)) * 100
      : 0

    return (
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            角色绑定完成
          </div>
        }
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setResultModalVisible(false)}>
            知道了
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '16px 0' }}>
          {/* 总体统计 */}
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>绑定统计</Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {bindingResult.totalBoundCharacters}
                </div>
                <div style={{ color: '#666' }}>成功绑定</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#fff2e8', borderRadius: 8, border: '1px solid #ffbb96' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                  {bindingResult.totalUnboundCharacters}
                </div>
                <div style={{ color: '#666' }}>未能绑定</div>
              </div>
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Text>绑定成功率</Text>
            </div>
            <Progress 
              percent={Math.round(successRate)} 
              status={successRate === 100 ? 'success' : successRate > 50 ? 'active' : 'exception'}
              strokeColor={successRate === 100 ? '#52c41a' : successRate > 50 ? '#1890ff' : '#ff4d4f'}
            />
          </div>

          {/* 处理详情 */}
          <div>
            <Title level={5}>处理详情</Title>
            <Text type="secondary">
              共处理 {bindingResult.processedShots} 个分镜
            </Text>
            
            {bindingResult.totalUnboundCharacters > 0 && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 6, border: '1px solid #ffd591' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                  <Text strong>未绑定角色</Text>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  以下角色在资源库中没有找到对应的图像，建议先添加这些角色到资源库：
                </Text>
                <div style={{ marginTop: 8 }}>
                  {Array.from(new Set(
                    bindingResult.shotResults.flatMap(shot => shot.unboundCharacters)
                  )).map(characterName => (
                    <Text key={characterName} code style={{ margin: '2px 4px 2px 0', display: 'inline-block' }}>
                      {characterName}
                    </Text>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <Button
        type="primary"
        icon={<LinkOutlined />}
        loading={loading}
        onClick={handleBindCharacters}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: 8,
          height: 40,
          fontWeight: 600
        }}
      >
        {loading ? '绑定中...' : '一键绑定角色'}
      </Button>
      
      {renderResultModal()}
    </>
  )
}

export default AutoBindingButton