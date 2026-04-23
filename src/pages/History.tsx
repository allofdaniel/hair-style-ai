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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

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
    const year = d.getFullYear().toString().slice(2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      {/* Status Bar Space */}
      <div className="h-12 w-full bg-white dark:bg-[#121212] sticky top-0 z-20" />

      {/* Header */}
      <header className="sticky top-12 z-20 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 className="text-lg font-bold text-center flex-1 text-gray-900 dark:text-white">
          {t('my_conversion_history')}
        </h1>
        {items.length > 0 && !deleteMode ? (
          <button
            onClick={() => setDeleteMode(true)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </header>

      {/* Delete Mode Bar */}
      {deleteMode && (
        <div className="sticky top-[108px] z-10 flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => { setDeleteMode(false); setSelectedIds(new Set()); }}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {t('cancel')}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.size}{t('selected_items')}
          </span>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className={`text-sm font-medium ${selectedIds.size > 0 ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}
          >
            {t('delete')}
          </button>
        </div>
      )}

      {/* Content */}
      <main className="px-3 py-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-pink-500 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('no_history')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('no_history_desc')}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-pink-500 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform"
            >
              {t('start')}
            </button>
          </div>
        ) : (
          <>
            {/* Count & Sort */}
            <div className="flex justify-between items-end mb-3">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('total') || '총'} <span className="text-gray-900 dark:text-white font-bold">{items.length}</span>{t('history_count')}
              </div>
              <button
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-0.5 hover:text-pink-500 transition-colors bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full"
              >
                {sortOrder === 'newest' ? (t('newest') || '최신순') : (t('oldest') || '오래된순')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
            </div>

            {/* Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-2">
              {sortedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewItem(item)}
                  className="flex flex-col gap-1.5 group cursor-pointer text-left"
                >
                  <div className={`aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 relative ${
                    deleteMode && selectedIds.has(item.id) ? 'ring-2 ring-pink-500' : ''
                  }`}>
                    <img
                      src={item.result}
                      alt={item.styleNameKo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {deleteMode && (
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 ${
                        selectedIds.has(item.id)
                          ? 'bg-pink-500 border-pink-500'
                          : 'border-white bg-black/20'
                      } flex items-center justify-center`}>
                        {selectedIds.has(item.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="px-1">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {item.styleNameKo || item.styleName}
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* FAB - Navigate to home */}
      {!deleteMode && (
        <button
          onClick={() => navigate('/')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-pink-500 rounded-full shadow-lg shadow-pink-500/30 flex items-center justify-center text-white z-30 hover:bg-pink-600 transition-all active:scale-95"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      )}
    </div>
  );
}
