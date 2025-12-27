import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F0F1A] to-[#1a1a2e] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold text-white mb-4">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나
          <br />
          이동되었을 수 있습니다.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            홈으로 이동
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
          >
            이전 페이지로
          </button>
        </div>
      </div>
    </div>
  );
}
