import { BrowserRouter } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import AppRouter from './router';

function App() {
  return (
    <AntdApp>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AntdApp>
  );
}

export default App;
