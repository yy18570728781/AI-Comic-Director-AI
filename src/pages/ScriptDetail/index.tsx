import { useParams } from 'react-router-dom';

function ScriptDetail() {
  const { id } = useParams();

  return (
    <div>
      <h2>剧本详情 - {id}</h2>
      <p>剧本详情页面开发中...</p>
    </div>
  );
}

export default ScriptDetail;
