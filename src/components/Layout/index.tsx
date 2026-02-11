import { useThemeStore } from '@/stores/useThemeStore';
import SiderLayout from './cpns/SiderLayout';
import TopNavLayout from './cpns/TopNavLayout';

export default function Layout() {
  const { theme } = useThemeStore();
  return theme === 'theme1' ? <TopNavLayout /> : <SiderLayout />;
}
