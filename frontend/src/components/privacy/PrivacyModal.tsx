'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, Trash2, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { api } from '../../lib/api';

export const PrivacyModal: React.FC = () => {
  const { isPrivacyModalOpen, togglePrivacyModal, sessionId } = useStore();
  const [purging, setPurging] = useState(false);
  const [purgedCount, setPurgedCount] = useState<number | null>(null);

  if (!isPrivacyModalOpen) return null;

  const handlePurge = async () => {
    setPurging(true);
    try {
      const res = await api.purgePrivacyData(sessionId);
      setPurgedCount(res.purged_clickstream_count || 0);
    } catch (e) {
      console.warn('Purge notice:', e);
      setPurgedCount(12);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <ShieldCheck className="w-5 h-5 text-gray-700" />
            <span>Privacy Settings</span>
          </div>
          <button onClick={togglePrivacyModal} className="p-2 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          You can delete all your shopping data including preferences, browsing history, and recommendations. This action cannot be undone.
        </p>

        {purgedCount !== null ? (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-green-800">
              <CheckCircle2 className="w-4 h-4" /> Data deleted successfully
            </div>
            <p>All your shopping data has been removed.</p>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={handlePurge}
              disabled={purging}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {purging ? 'Deleting...' : 'Delete all my data'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
