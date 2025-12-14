import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';

export default function History() {
  const navigate = useNavigate();
  const { history, setUserPhoto, setSelectedStyle, setResultImage } = useAppStore();

  const handleViewItem = (item: typeof history[0]) => {
    setUserPhoto(item.original);
    setSelectedStyle(item.style);
    setResultImage(item.result);
    navigate('/result');
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)] flex flex-col safe-area-top safe-area-bottom">
      <header className="p-4 flex items-center border-b border-[var(--color-bg-card)]">
        <button onClick={() => navigate(-1)} className="text-white text-2xl mr-4">
          ←
        </button>
        <h1 className="text-white font-bold text-lg">My Transformations</h1>
      </header>

      <main className="flex-1 p-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-white font-bold text-xl mb-2">No transformations yet</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Try your first hairstyle transformation!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 gradient-primary rounded-xl text-white font-medium"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => handleViewItem(item)}
                className="bg-[var(--color-bg-card)] rounded-2xl overflow-hidden text-left"
              >
                <div className="aspect-square relative">
                  <img
                    src={item.result}
                    alt={item.style.nameKo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white font-medium text-sm truncate">
                      {item.style.nameKo}
                    </p>
                    <p className="text-[var(--color-text-muted)] text-xs">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
