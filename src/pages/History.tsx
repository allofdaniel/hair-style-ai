import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { getAllHistory, deleteHistory, type HistoryItem } from '../services/storage';
import { useI18n } from '../i18n/useI18n';

export default function History() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { setUserPhoto, setResultImage } = useAppStore();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getAllHistory();
      setItems(history);
    } catch (error) {
      console.error('히스토리 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleViewItem = (item: HistoryItem) => {
    if (deleteMode) {
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.has(item.id) ? newSet.delete(item.id) : newSet.add(item.id);
        return newSet;
      });
      return;
    }
    setUserPhoto(item.original);
    setResultImage(item.result);
    navigate('/result');
  };

  const handleDeleteSelected = async () => {
    try {
      for (const id of selectedIds) await deleteHistory(id);
      setItems(prev => prev.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      setDeleteMode(false);
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#f2f4f6]">
        <div className="flex items-center justify-between h-14 px-5">
          <button onClick={() => navigate(-1)} className="text-[15px] text-[#191f28]">
            {t('close')}
          </button>
          <span className="text-[17px] font-semibold text-[#191f28]">{t('history')}</span>
          {items.length > 0 ? (
            deleteMode ? (
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className={`text-[15px] font-medium ${selectedIds.size > 0 ? 'text-[#f04452]' : 'text-[#b0b8c1]'}`}
              >
                {t('delete')} {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
            ) : (
              <button onClick={() => setDeleteMode(true)} className="text-[15px] text-[#6b7684]">
                {t('edit')}
              </button>
            )
          ) : <div className="w-10" />}
        </div>
        {deleteMode && (
          <div className="flex justify-between px-5 py-2 bg-[#f9fafb] border-t border-[#f2f4f6]">
            <button onClick={() => { setDeleteMode(false); setSelectedIds(new Set()); }} className="text-[14px] text-[#6b7684]">
              {t('cancel')}
            </button>
            <span className="text-[14px] text-[#8b95a1]">{selectedIds.size}{t('selected_items')}</span>
          </div>
        )}
      </header>

      {/* 컨텐츠 */}
      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#e5e8eb] border-t-[#3182f6] rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[18px] font-semibold text-[#191f28] mb-2">{t('no_history')}</p>
            <p className="text-[14px] text-[#8b95a1] mb-6">{t('no_history_desc')}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#3182f6] text-white text-[15px] font-medium rounded-xl"
            >
              {t('start')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewItem(item)}
                className={`relative rounded-2xl overflow-hidden ${
                  deleteMode && selectedIds.has(item.id) ? 'ring-2 ring-[#3182f6]' : ''
                }`}
              >
                <div className="aspect-square">
                  <img src={item.result} alt={item.styleNameKo} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-[13px] font-medium truncate">{item.styleNameKo}</p>
                  <p className="text-white/60 text-[11px]">{formatDate(item.date)}</p>
                </div>
                {deleteMode && (
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 ${
                    selectedIds.has(item.id) ? 'bg-[#3182f6] border-[#3182f6]' : 'border-white bg-black/20'
                  } flex items-center justify-center`}>
                    {selectedIds.has(item.id) && <span className="text-white text-[12px]">✓</span>}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {items.length > 0 && (
        <div className="text-center py-4 text-[12px] text-[#b0b8c1]">
          {items.length}{t('history_count')}
        </div>
      )}
    </div>
  );
}
