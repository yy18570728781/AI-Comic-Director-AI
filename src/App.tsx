import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import AppRouter from './router';
import GlobalTaskPoller from './components/GlobalTaskPoller';

function App() {
  return (
    <AntdApp>
      <BrowserRouter>
        <GlobalTaskPoller />
        <AppRouter />
      </BrowserRouter>
    </AntdApp>
  );
}

export default App;
