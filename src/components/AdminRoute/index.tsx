import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useUserStore } from '@/stores/useUserStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser?.role !== 'admin') {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="当前账号不是管理员，无法进入管理后台。"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
