import { useNavigate } from 'react-router-dom';
import { Button, Space } from 'antd';
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useUserStore } from '@/stores/useUserStore';
import { useThemeStore } from '@/stores/useThemeStore';
import TopNavBar from '@/components/Layout/cpns/TopNavBar';
import './style.css';

const features = [
  { icon: <EditOutlined />, title: 'AI 剧本创作', desc: '输入故事大纲，AI 自动生成分镜脚本' },
  { icon: <PictureOutlined />, title: '智能图像生成', desc: '多模型支持，一键生成高质量漫画画面' },
  { icon: <PlayCircleOutlined />, title: '图生视频', desc: '静态画面秒变动态短剧，支持多种风格' },
  { icon: <ThunderboltOutlined />, title: '批量生产', desc: '队列化任务管理，高效批量输出内容' },
];

const workflowSteps = ['输入故事大纲', 'AI 生成分镜', '生成画面', '合成视频'];

const showcaseImageFiles = [
  '2-开局就是满级仙尊.jpg',
  '3-咒术反噬我有无限血条.png',
  '4-末日壁垒.png',
  '5-狱界锁妖局.png',
  '7-菜鸟那是你没见过我的机甲.png',
  '8-开局饕餮血统我吞噬一切.png',
  '9-我在未世当老板员工全是S级变异体.jpeg',
  '10-满级大佬的咸鱼日常.jpg',
  '11-开同被嘲废柴我绑定未来未来传奇系统.jpg',
  '12-公主殿下您的钞能力已到账.jpeg',
  '14-骷髅王炸契约校花.png',
  '15-我靠双宗在末世征服检花.png',
  '16-大道至简.jpg',
  '17-神兽遍地.jpg',
  '18-我掀翻越诡异世界.jpeg',
  '21-师傅别再给了.jpg',
  '22-我在末世当老师.png',
  '23-我的古董大君不可能这么好看.jpeg',
  '24-我长得太凶吓哭全球诡异.jpg',
  '25-荒年穿越成农家子我有兑换商城.jpeg',
  '27-无线返还我买爆了，诡异末日.jpeg',
];

const showcaseImages = showcaseImageFiles.map(
  (fileName) => `/previewImg/${encodeURIComponent(fileName)}`
);

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { theme } = useThemeStore();

  const handleCTA = () => navigate(currentUser ? '/ai-creation' : '/login');

  return (
    <div className="home-container" data-theme={theme}>
      {/* 主题1：星空 */}
      {theme === 'theme1' && (
        <div className="home-stars">
          {Array.from({ length: 80 }, (_, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 粒子 */}
      <div className="home-particles">
        {Array.from({ length: 25 }, (_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      <TopNavBar showThemeToggle />

      {/* Hero */}
      <section className="home-hero">
        {theme === 'theme1' && (
          <video className="home-hero-video" autoPlay loop muted playsInline>
            <source src="/video/home.mp4" type="video/mp4" />
          </video>
        )}
        <div className="home-hero-overlay" />
        <div className="home-hero-glow" />
        <h1 className="home-hero-title">
          <span className="home-gradient-text">一站式 AI 短剧制作中心</span>
        </h1>
        <p className="home-hero-subtitle">智能平台高效创作 | 小投入产出大流量</p>
        <Space size="large" style={{ marginTop: 40 }}>
          <Button
            type="primary"
            size="large"
            icon={<ThunderboltOutlined />}
            className="home-cta-btn"
            onClick={handleCTA}
          >
            开始创作
          </Button>
          {theme === 'theme2' && (
            <Button
              size="large"
              ghost
              className="home-ghost-btn"
              onClick={() =>
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              了解更多
            </Button>
          )}
        </Space>

        {theme === 'theme1' && (
          <div className="home-showcase">
            <div className="home-showcase-track">
              {[...showcaseImages, ...showcaseImages].map((src, i) => (
                <div key={i} className="home-showcase-card">
                  <img src={src} alt={`showcase-${i}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 功能卡片 */}
      <section id="features" className="home-features">
        <h2 className="home-section-title">核心能力</h2>
        <div className="home-features-grid">
          {features.map((f, i) => (
            <div key={i} className="home-feature-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="home-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 工作流 */}
      <section className="home-workflow">
        <h2 className="home-section-title">创作流程</h2>
        <div className="home-workflow-steps">
          {workflowSteps.map((step, i) => (
            <div key={i} className="home-workflow-step">
              <div className="home-step-number">{i + 1}</div>
              <span>{step}</span>
              {i < workflowSteps.length - 1 && <div className="home-step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="home-bottom-cta">
        <h2>准备好开始创作了吗？</h2>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          className="home-cta-btn"
          onClick={handleCTA}
        >
          免费开始
        </Button>
      </section>

      <footer className="home-footer">
        <span>© 2026 AI 漫剧工作台</span>
      </footer>
    </div>
  );
}
