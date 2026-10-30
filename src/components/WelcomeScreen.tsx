import React, { useState, useEffect } from 'react';
import { PlayerColor, UserProfile } from '../types/game';
import { PLAYER_COLORS } from '../data/categories';
import { PlayerPawn } from './PlayerPawn';
import { Sparkles, Play, LogIn } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface WelcomeScreenProps {
  initialRoomCode?: string;
  initialProfile: UserProfile;
  isOnline?: boolean;
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
  const { t, language, toggleLanguage } = useTranslation();
  const [name, setName] = useState(initialProfile.name || '');
  const [color, setColor] = useState<PlayerColor>(initialProfile.color || PLAYER_COLORS[0].hex);
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [activeTab, setActiveTab] = useState<'CREATE' | 'JOIN'>(initialRoomCode ? 'JOIN' : 'CREATE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setErrorMessage(t('enterNameError'));
      return;
    }
    setErrorMessage(null);
    await onCreateRoom(name.trim(), color);
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      setErrorMessage(t('enterNameError'));
      return;
    }
    if (!roomCode.trim() || roomCode.trim().length < 4) {
      setErrorMessage(t('enterCodeError'));
      return;
    }
    setErrorMessage(null);
    const res = await onJoinRoom(roomCode.trim(), name.trim(), color);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto min-h-[100dvh] flex flex-col justify-between px-3 py-3 select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between h-12 px-1 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-yellow border-2 border-black shadow-brutal-sm flex items-center justify-center font-black text-sm">
            🎭
          </div>
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-base font-black text-black tracking-tight leading-none">
              {t('appTitle')}
            </span>
            <span className="bg-brand-purple/15 text-brand-purple text-[10px] font-black px-1.5 py-0.5 rounded-md border border-black/20 whitespace-nowrap">
              {t('appSubtitle')}
            </span>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="px-3 h-8 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-brutal-sm flex items-center justify-center font-black text-xs text-black active:translate-x-[1px] active:translate-y-[1px] transition-all"
          title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
        >
          <span>{t('langToggle')}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4 my-auto">
        {/* Brand Tagline */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-yellow rounded-full border-2 border-black font-black text-xs shadow-brutal-sm mb-2">
            <Sparkles className="w-3.5 h-3.5 text-black fill-black" />
            <span>{t('appSubtitle')}</span>
          </div>
          <p className="text-xs sm:text-sm font-black text-gray-800 max-w-[320px] mx-auto leading-relaxed">
            {t('tagline')}
          </p>
        </div>

        {/* Profile Card with Live Avatar Preview */}
        <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-4 shadow-brutal">
          {/* Avatar Preview + Name Input */}
          <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0 p-1 bg-[#FAF8F5] rounded-2xl border-2 border-black shadow-brutal-sm">
              <PlayerPawn
                color={color}
                size="sm"
                isActive={true}
                showName={false}
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-black text-black mb-1">
                {t('yourNameLabel')}
              </label>
              <input
                type="text"
                value={name}
                maxLength={16}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('namePlaceholder')}
                className="w-full px-3 py-2 text-xs font-black border-2 border-black rounded-xl bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
              />
            </div>
          </div>

          {/* Color Palette Selector */}
          <div>
            <label className="block text-[11px] font-black text-gray-700 mb-1.5">
              {t('colorLabel')}
            </label>
            <div className="flex justify-between items-center gap-1">
              {PLAYER_COLORS.map((c) => {
                const isSelected = color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleColorChange(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 border-black transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-black scale-110 shadow-brutal-sm'
                        : 'opacity-75 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={language === 'ar' ? c.labelAr : c.labelEn}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Controls: Create Room vs Join Room */}
        <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-4 shadow-brutal">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0EDE6] rounded-2xl border-2 border-black mb-3">
            <button
              onClick={() => { setActiveTab('CREATE'); setErrorMessage(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'CREATE'
                  ? 'bg-brand-yellow text-black border-2 border-black shadow-brutal-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t('tabCreate')}</span>
            </button>

            <button
              onClick={() => { setActiveTab('JOIN'); setErrorMessage(null); }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === 'JOIN'
                  ? 'bg-brand-cyan text-black border-2 border-black shadow-brutal-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('tabJoin')}</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'CREATE' ? (
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                {t('createDesc')}
              </p>

              {errorMessage && (
                <div className="p-2 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 text-xs font-black">
                  ⚠️ {errorMessage}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isConnecting}
                className="w-full py-3 bg-brand-green hover:bg-[#68d778] text-black font-black text-sm rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isConnecting ? t('creatingBtn') : t('createBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  {t('enterCodeLabel')}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={t('codePlaceholder')}
                  className="w-full px-3 py-2 text-center text-lg font-mono font-black tracking-widest border-2 border-black rounded-xl bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
                />
              </div>

              {errorMessage && (
                <div className="p-2 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 text-xs font-black">
                  ⚠️ {errorMessage}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={isConnecting}
                className="w-full py-3 bg-brand-cyan hover:bg-[#5bc9e4] text-black font-black text-sm rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{isConnecting ? t('joiningBtn') : t('joinBtn')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="text-center py-2 text-[10px] font-bold text-gray-500">
        {t('footerNotice')}
      </footer>
    </div>
  );
};
