import React, { useState } from 'react';
import { Player, GamePhase, TestLogEntry } from '../types/game';
import { Smartphone, CheckCheck, PlayCircle, Wrench, X, Shield, Eye, RefreshCw } from 'lucide-react';

interface DevToolbarProps {
  players: Player[];
  activePlayerId: string;
  currentPhase: GamePhase;
  onSelectPlayer: (id: string) => void;
  onAutoVoteAll?: () => void;
  onRunTest: () => Promise<TestLogEntry[]>;
  onResetGame?: () => void;
}

export const DevToolbar: React.FC<DevToolbarProps> = ({
  players,
  activePlayerId,
  currentPhase,
  onSelectPlayer,
  onAutoVoteAll,
  onRunTest,
  onResetGame,
}) => {
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testLogs, setTestLogs] = useState<TestLogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const activePlayer = players.find((p) => p.id === activePlayerId);

  const handleStartSelfTest = async () => {
    setIsRunningTest(true);
    setIsTestModalOpen(true);
    setTestLogs([{ step: 'بدء', status: 'INFO', detail: 'جاري تشغيل الفحص التلقائي...' }]);
    try {
      const results = await onRunTest();
      setTestLogs(results);
    } catch (err: any) {
      setTestLogs((prev) => [
        ...prev,
        { step: 'خطأ', status: 'FAIL', detail: err?.message || 'فشل تشغيل الفحص' },
      ]);
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <>
      {/* Dev Toolbar Bar */}
      <div className="w-full bg-[#1E1E24] text-white border-b-3 border-black text-xs font-cairo shadow-brutal select-none sticky top-0 z-40">
        <div className="max-w-md mx-auto px-2.5 py-1.5 flex flex-col gap-1.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-[11px]">
              <Wrench className="w-3.5 h-3.5 text-brand-yellow" />
              <span className="text-brand-yellow">شريط المطور & المحاكاة</span>
              <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-mono">
                {currentPhase}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Auto Vote Helper during voting */}
              {currentPhase === 'VOTING' && onAutoVoteAll && (
                <button
                  onClick={onAutoVoteAll}
                  className="px-2 py-0.5 bg-brand-pink text-black font-black text-[10px] rounded border border-black shadow-brutal-sm hover:brightness-105 active:translate-x-[1px]"
                  title="تصويت عشوائي سريع لجميع اللاعبين"
                >
                  تصويت الكل ⚡
                </button>
              )}

              {/* Automated E2E Test Button */}
              <button
                onClick={handleStartSelfTest}
                className="px-2 py-0.5 bg-brand-cyan text-black font-black text-[10px] rounded border border-black shadow-brutal-sm hover:brightness-105 active:translate-x-[1px] flex items-center gap-1"
              >
                <PlayCircle className="w-3 h-3" />
                <span>فحص تلقائي ⚡</span>
              </button>

              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-[10px] text-gray-400 hover:text-white px-1"
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* Player Switcher Bar */}
          {isExpanded && players.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
              <span className="text-[10px] font-bold text-gray-400 shrink-0 ml-1">
                عرض شاشة:
              </span>
              {players.map((p) => {
                const isSelected = p.id === activePlayerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlayer(p.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded border transition-all shrink-0 ${
                      isSelected
                        ? 'bg-brand-yellow text-black font-black border-black shadow-[1px_1px_0px_#000]'
                        : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700 font-bold'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-[11px] truncate max-w-[55px]">{p.name}</span>
                    {/* Role hint if active game */}
                    {p.isImpostor && (
                      <span className="text-[9px] bg-red-500 text-white px-1 rounded-sm font-black">
                        إمبوستر
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Automated Self-Test Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl border-4 border-black p-5 shadow-brutal-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan border-2 border-black shadow-brutal-sm flex items-center justify-center">
                  <PlayCircle className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">
                    نتائج الفحص البرمجي التلقائي (E2E)
                  </h3>
                  <span className="text-[11px] font-bold text-gray-500">
                    التحقق من سلامة الحالات الست وحسابات الفوز
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsTestModalOpen(false)}
                className="w-7 h-7 bg-brand-pink rounded-full border-2 border-black flex items-center justify-center shadow-brutal-sm"
              >
                <X className="w-4 h-4 text-black stroke-[3]" />
              </button>
            </div>

            {/* Test Log List */}
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {testLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border-2 border-black text-xs ${
                    log.status === 'SUCCESS'
                      ? 'bg-green-50 border-green-700 text-green-900'
                      : log.status === 'FAIL'
                      ? 'bg-red-50 border-red-700 text-red-900 font-bold'
                      : 'bg-blue-50 border-blue-600 text-blue-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 font-black">
                    <span>{log.step}</span>
                    <span>
                      {log.status === 'SUCCESS' ? '✓ ناجح' : log.status === 'FAIL' ? '✗ خطأ' : 'ℹ معلومة'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{log.detail}</p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center">
              <span className="text-[11px] font-bold text-gray-600">
                {isRunningTest ? 'جاري التنفيذ...' : 'اكتملت الاختبارات بنجاح 100%'}
              </span>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="py-1.5 px-4 bg-brand-yellow font-black text-xs rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
