'use client';
import { useState } from 'react';
import { Activity, Clock } from 'lucide-react';

export default function ClickstreamSimulator({ history, onAddSimulatedAction, onClearHistory }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Clickstream Sequence Simulator</h4>
            <p className="text-slate-400 text-[10px] mt-0.5">Push simulated click sequences to re-trigger model encodes</p>
          </div>
        </div>
        
        {/* Toggle Expand Drawer Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
        >
          {isOpen ? 'Hide History' : `Show History (${history.length})`}
        </button>
      </div>

      {/* Simulator buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onAddSimulatedAction('Product Click', 'Bag of Organic Bananas')}
          className="bg-slate-50 hover:bg-indigo-55 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-2.5 text-left transition-all"
        >
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Sequence Trigger</span>
          <span className="text-xs font-semibold text-slate-700 mt-1 block">Click Banana</span>
        </button>
        <button
          onClick={() => onAddSimulatedAction('Product Click', 'Organic Hass Avocado')}
          className="bg-slate-50 hover:bg-indigo-55 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-2.5 text-left transition-all"
        >
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Sequence Trigger</span>
          <span className="text-xs font-semibold text-slate-700 mt-1 block">Click Avocado</span>
        </button>
        <button
          onClick={() => onAddSimulatedAction('Cart Action', 'Organic Whole Milk')}
          className="bg-slate-50 hover:bg-indigo-55 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-2.5 text-left transition-all"
        >
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Sequence Trigger</span>
          <span className="text-xs font-semibold text-slate-700 mt-1 block">Add Milk to Cart</span>
        </button>
        <button
          onClick={() => onAddSimulatedAction('Purchase Submit', 'Organic Strawberries')}
          className="bg-slate-50 hover:bg-indigo-55 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-2.5 text-left transition-all"
        >
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider block">Sequence Trigger</span>
          <span className="text-xs font-semibold text-slate-700 mt-1 block">Buy Strawberries</span>
        </button>
      </div>

      {/* History log list */}
      {isOpen && (
        <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Active Session clickstream sequence
            </span>
            {history.length > 0 && (
              <button 
                onClick={onClearHistory}
                className="text-[9px] text-slate-400 hover:text-rose-600 underline font-bold"
              >
                Reset Sequence
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1">
            {history.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                No simulated sequence loaded. Click buttons above.
              </div>
            ) : (
              history.map((evt, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] bg-white border border-slate-100 rounded-xl px-3 py-2 animate-fade-in shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md leading-none">
                      {evt.action}
                    </span>
                    <span className="text-slate-700 font-semibold">{evt.item}</span>
                  </div>
                  <span className="text-[9px] text-slate-400">{evt.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
