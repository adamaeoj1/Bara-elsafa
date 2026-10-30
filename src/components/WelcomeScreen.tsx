import React, { useState, useEffect } from 'react';
import { PlayerColor, UserProfile } from '../types/game';
import { PLAYER_COLORS } from '../data/categories';
import { PlayerPawn } from './PlayerPawn';
import { Sparkles, Play, LogIn, Users, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  initialRoomCode?: string;
  initialProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onCreateRoom: (name: string, color: PlayerColor) => Promise<void>;
  onJoinRoom: (code: string, name: string, color: PlayerColor) => Promise<{ success: boolean; error?: string }>;
  isConnecting?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  initialRoomCode = '',
  initialProfile,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  isConnecting = false,
}) => {
  const [name, setName] = useState(initialProfile.name || '');
  const [color, setColor] = useState<PlayerColor>(initialProfile.color || PLAYER_COLORS[0].hex);
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>(initialRoomCode ? 'JOIN' : 'CREATE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initialRoomCode if URL had it
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setActiveTab('JOIN');
    }
  }, [initialRoomCode]);

  const handleNameChange = (val: string) => {
    setName(val);
    onUpdateProfile({ name: val });
  };

  const handleColorChange = (c: PlayerColor) => {
    setColor(c);
    onUpdateProfile({ color: c });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMessage('الرجاء كتابة اسمك أولاً للدخول إلى اللعبة');
      return;
    }
    setErrorMessage(null);
    await onCreateRoom(name.trim(), color);
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      setErrorMessage('الرجاء كتابة اسمك أولاً للدخول إلى اللعبة');
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 4) {
      setErrorMessage('الرجاء إدخال رمز الغرفة المكون من 4 أرقام');
      return;
    }
    setErrorMessage(null);
    const res = await onJoinRoom(roomCode.trim(), name.trim(), color);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EB] flex flex-col justify-center items-center px-4 py-8 font-cairo select-none">
      <div className="max-w-md w-full flex flex-col gap-5">
        {/* App Title Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-yellow rounded-full border-3 border-black font-black text-xs shadow-brutal-sm mb-3">
            <Sparkles className="w-4 h-4 text-black fill-black" />
            <span>لعبة الاستنتاج والذكاء الاجتماعي</span>
          </div>

          <h1 className="text-4xl font-black text-black tracking-tight flex items-center justify-center gap-2">
            <span>شوتايم</span>
            <span className="text-brand-purple">| برا السالفة</span>
            <span>🎭</span>
          </h1>
          <p className="text-xs font-bold text-gray-600 mt-1 max-w-[300px] mx-auto">
            مين برا السالفة ومسوي فاهم؟ العبها مع أخوياك أونلاين في نفس الغرفة!
          </p>
        </div>

        {/* Profile Card with Live Avatar Preview */}
        <div className="bg-white rounded-3xl border-4 border-black p-5 shadow-brutal-xl">
          <div className="flex items-center justify-between border-b-2 border-black/10 pb-3 mb-4">
            <h2 className="text-sm font-black text-black flex items-center gap-1.5">
              <span>تجهيز شخصيتك</span>
              <span className="text-xs">👤</span>
            </h2>
            <span className="text-[11px] font-bold text-gray-500">
              يُحفظ تلقائياً في جهازك
            </span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            {/* Live Interactive Pawn Preview */}
            <div className="bg-[#F8F5EC] p-2 rounded-2xl border-3 border-black shadow-brutal-sm shrink-0">
              <PlayerPawn
                color={color}
                name={name.trim() || 'اسمك'}
                size="md"
                isActive={true}
                badge="أنت"
              />
            </div>

            {/* Name Input */}
            <div className="flex-1">
              <label className="text-xs font-black text-gray-800 block mb-1">
                اسمك في اللعبة:
              </label>
              <input
                type="text"
                maxLength={14}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="مثال: فيصل، سارة، أبو خالد..."
                className="w-full px-3.5 py-2.5 font-bold text-sm bg-cream border-2 border-black rounded-xl outline-none focus:ring-2 focus:ring-brand-purple shadow-[2px_2px_0px_#000]"
              />
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-black text-gray-800 block mb-1.5">
              اختر لون بيْدَق شخصيتك:
            </label>
            <div className="flex justify-between items-center gap-1.5 bg-[#FAF8F5] p-2 rounded-2xl border-2 border-black">
              {PLAYER_COLORS.map((c) => {
                const isSelected = color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleColorChange(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 border-black transition-all ${
                      isSelected
                        ? 'scale-115 ring-3 ring-black shadow-[2px_2px_0px_#000]'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.label}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Tabs: Create Room vs Join Room */}
        <div className="bg-white rounded-3xl border-4 border-black p-5 shadow-brutal-xl">
          <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 p-1 rounded-2xl border-2 border-black">
            <button
              onClick={() => { setActiveTab('CREATE'); setErrorMessage(null); }}
              className={`py-2 rounded-xl font-black text-xs transition-all ${
                activeTab === 'CREATE'
                  ? 'bg-brand-yellow text-black border-2 border-black shadow-brutal-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              إنشاء غرفة جديدة 🎮
            </button>
            <button
              onClick={() => { setActiveTab('JOIN'); setErrorMessage(null); }}
              className={`py-2 rounded-xl font-black text-xs transition-all ${
                activeTab === 'JOIN'
                  ? 'bg-brand-cyan text-black border-2 border-black shadow-brutal-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              انضمام لغرفة 🔑
            </button>
          </div>

          {activeTab === 'CREATE' ? (
            /* CREATE ROOM VIEW */
            <div className="flex flex-col gap-3 animate-fade-in">
              <p className="text-xs font-bold text-gray-600 leading-relaxed text-right">
                ستكون أنت مضيف الغرفة (Host)، يمكنك اختيار فئة الكلمات، بدء الجولات، ومشاركة الرابط مع أصدقائك.
              </p>

              <button
                onClick={handleCreate}
                disabled={isConnecting}
                className="w-full py-4 bg-brand-green hover:bg-[#68d778] text-black font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-black" />
                <span>{isConnecting ? 'جاري تجهيز الغرفة...' : 'إنشاء الغرفة والدخول 🚀'}</span>
              </button>
            </div>
          ) : (
            /* JOIN ROOM VIEW */
            <div className="flex flex-col gap-3 animate-fade-in">
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1 text-right">
                  أدخل رمز الغرفة المكون من 4 أرقام:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="مثال: 8421"
                  className="w-full text-center tracking-widest text-2xl font-black py-2.5 bg-cream border-2 border-black rounded-xl outline-none focus:ring-2 focus:ring-brand-cyan shadow-[2px_2px_0px_#000]"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isConnecting}
                className="w-full py-4 bg-brand-cyan hover:bg-[#5bc9e4] text-black font-black text-base rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5 stroke-[2.5]" />
                <span>{isConnecting ? 'جاري التحقق...' : 'انضمام إلى الغرفة 🚀'}</span>
              </button>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mt-3 p-2.5 bg-red-100 border-2 border-red-500 rounded-xl text-center text-xs font-black text-red-700 animate-fade-in">
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] font-bold text-gray-500">
          شوتايم - برا السالفة • لعب جماعي حقيقي عبر المتصفح ⚡
        </div>
      </div>
    </div>
  );
};
