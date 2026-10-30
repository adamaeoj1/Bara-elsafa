import React, { useState } from 'react';
import { Player, Category, PlayerColor } from '../../types/game';
import { CATEGORIES, PLAYER_COLORS } from '../../data/categories';
import { Users, Play, Copy, Check, Sparkles, Plus, KeyRound } from 'lucide-react';
import { PlayerPawn } from '../PlayerPawn';

interface LobbyPhaseProps {
  roomCode: string;
  players: Player[];
  activePlayerId: string;
  selectedCategoryId: string;
  isHost: boolean;
  onSelectCategory: (categoryId: string) => void;
  onOpenLockedCategory: () => void;
  onStartGame: () => void;
  onQuickPreset: (count: 4 | 7) => void;
  onCreateRoom: (name: string, color: PlayerColor) => void;
  onJoinRoom: (code: string, name: string, color: PlayerColor) => void;
}

export const LobbyPhase: React.FC<LobbyPhaseProps> = ({
  roomCode,
  players,
  activePlayerId,
  selectedCategoryId,
  isHost,
  onSelectCategory,
  onOpenLockedCategory,
  onStartGame,
  onQuickPreset,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState('أنا');
  const [colorInput, setColorInput] = useState<PlayerColor>(PLAYER_COLORS[0].hex);
  const [codeInput, setCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const copyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStart = players.length >= 3;

  return (
    <div className="flex flex-col gap-5 max-w-md mx-auto w-full pb-6">
      {/* Top Header Card with Room Code */}
      <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-yellow rounded-xl border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-xl">
            🎭
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 block">رمز الغرفة</span>
            <div className="text-2xl font-black tracking-widest text-black flex items-center gap-2">
              <span>{roomCode}</span>
            </div>
          </div>
        </div>

        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-cyan hover:bg-[#5bc9e4] rounded-xl border-2 border-black font-black text-xs shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
          <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
        </button>
      </div>

      {/* Quick Setup Presets Bar */}
      <div className="bg-[#FFF9E6] rounded-2xl border-2 border-black p-3.5 shadow-brutal">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-brand-purple fill-brand-purple" />
          <span className="text-xs font-black text-gray-800">إعداد فوري وسريع للتجربة:</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onQuickPreset(4)}
            className="py-2.5 px-2 bg-brand-pink hover:bg-[#ff6da1] text-black rounded-xl border-2 border-black font-black text-xs shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <span>⚡ 4 لاعبين</span>
            <span className="text-[10px] font-bold opacity-90">(1 إمبوستر)</span>
          </button>
          <button
            onClick={() => onQuickPreset(7)}
            className="py-2.5 px-2 bg-brand-purple hover:bg-[#a272ff] text-black rounded-xl border-2 border-black font-black text-xs shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1"
          >
            <span>⚡ 7 لاعبين</span>
            <span className="text-[10px] font-bold opacity-90">(2 إمبوستر)</span>
          </button>
        </div>
      </div>

      {/* Category Selection Carousel / Grid */}
      <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-black flex items-center gap-2">
            <span>اختر السالفة</span>
            <span className="text-xs bg-brand-yellow px-2 py-0.5 rounded-full border border-black shadow-brutal-sm">
              الفئات
            </span>
          </h2>
          <span className="text-xs font-bold text-gray-500">
            {CATEGORIES.filter((c) => !c.isLocked).length} مفتوحة
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.isLocked) {
                    onOpenLockedCategory();
                  } else {
                    onSelectCategory(cat.id);
                  }
                }}
                className={`relative flex items-center gap-2 p-3 rounded-xl border-2 border-black text-right transition-all ${
                  cat.isLocked
                    ? 'bg-gray-100 opacity-80 hover:bg-gray-200'
                    : isSelected
                    ? 'bg-brand-yellow font-black shadow-brutal-sm scale-[1.02]'
                    : 'bg-white hover:bg-gray-50 font-bold'
                } active:translate-x-[1px] active:translate-y-[1px]`}
              >
                <span className="text-xl">{cat.icon}</span>
                <div className="flex-1 truncate">
                  <div className="text-xs font-black truncate">{cat.name}</div>
                  <div className="text-[10px] text-gray-600 font-bold">
                    {cat.isLocked ? 'محتوى حصري 🔒' : `${cat.words.length} كلمة`}
                  </div>
                </div>

                {isSelected && !cat.isLocked && (
                  <div className="w-5 h-5 bg-black rounded-full text-white flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Players List Card */}
      <div className="bg-white rounded-2xl border-3 border-black p-4 shadow-brutal">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black" />
            <span className="text-sm font-black text-black">
              اللاعبون المتصلون ({players.length})
            </span>
          </div>
          <span className="text-[11px] font-bold text-gray-500">
            الحد الأدنى: 3 لاعبين
          </span>
        </div>

        {players.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-xs font-bold bg-[#F9F7F2] rounded-xl border border-dashed border-gray-400">
            لم ينضم أي لاعب بعد. استخدم الإعداد الفوري بالأعلى أو انضم عبر الرمز!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {players.map((p) => {
              const isMe = p.id === activePlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border-2 border-black ${
                    isMe ? 'bg-[#FFF8E7] shadow-brutal-sm' : 'bg-white'
                  }`}
                >
                  <PlayerPawn
                    color={p.color}
                    size="sm"
                    showName={false}
                    isActive={true}
                  />
                  <div className="truncate flex-1">
                    <div className="text-xs font-black truncate flex items-center gap-1">
                      <span>{p.name}</span>
                      {p.isHost && (
                        <span className="text-[9px] bg-brand-yellow px-1 py-0.2 rounded border border-black">
                          مضيف
                        </span>
                      )}
                    </div>
                    {isMe && (
                      <span className="text-[10px] text-brand-purple font-bold block">
                        (أنت)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Host Start Button or Player Waiting Message */}
      {isHost ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl border-3 border-black font-black text-lg flex items-center justify-center gap-2 shadow-brutal transition-all ${
              canStart
                ? 'bg-brand-green hover:bg-[#68d778] text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer'
                : 'bg-gray-200 text-gray-400 border-gray-400 shadow-none cursor-not-allowed'
            }`}
          >
            <Play className="w-6 h-6 fill-current" />
            <span>ابدأ اللعبة 🎮</span>
          </button>
          {!canStart && (
            <p className="text-center text-xs font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-300">
              ⚠️ تحتاج إلى 3 لاعبين على الأقل للبدء. اضغط على أزرار الإعداد الفوري بالأعلى!
            </p>
          )}
        </div>
      ) : (
        <div className="bg-brand-cyan/20 border-2 border-brand-cyan rounded-2xl p-4 text-center">
          <div className="text-sm font-black text-black mb-1 animate-pulse">
            في انتظار المضيف لبدء اللعبة... ⏳
          </div>
          <div className="text-xs text-gray-600 font-bold">
            جهّز نفسك وركّز مين ممكن يكون برا السالفة!
          </div>
        </div>
      )}

      {/* Manual Join / Create Drawer Toggle */}
      <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-xs">
        <button
          onClick={() => setShowJoinModal(true)}
          className="text-gray-700 font-bold underline hover:text-black flex items-center gap-1"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>الانضمام برمز غرفة آخر أو تغيير الاسم</span>
        </button>
      </div>

      {/* Join/Change Name Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-4 border-black p-5 max-w-sm w-full shadow-brutal-xl">
            <h3 className="text-base font-black text-black mb-3">
              إعدادات اللاعب
            </h3>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">اسمك</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full p-2.5 border-2 border-black rounded-xl font-bold text-sm bg-cream outline-none focus:ring-2 focus:ring-brand-purple"
                  placeholder="اكتب اسمك هنا"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">لون شخصيتك</label>
                <div className="flex gap-2 justify-center py-1">
                  {PLAYER_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setColorInput(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 border-black ${
                        colorInput === c.hex ? 'scale-125 ring-2 ring-black' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">رمز الغرفة (للانضمام)</label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="مثال: 8421"
                  className="w-full p-2.5 border-2 border-black rounded-xl font-bold text-sm bg-cream outline-none focus:ring-2 focus:ring-brand-cyan text-center tracking-widest"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    if (codeInput.trim()) {
                      onJoinRoom(codeInput.trim(), nameInput, colorInput);
                    } else {
                      onCreateRoom(nameInput, colorInput);
                    }
                    setShowJoinModal(false);
                  }}
                  className="flex-1 py-2.5 bg-brand-yellow font-black text-xs rounded-xl border-2 border-black shadow-brutal-sm"
                >
                  حفظ والانضمام
                </button>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="py-2.5 px-4 bg-gray-100 font-bold text-xs rounded-xl border-2 border-black"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
