import React, { useState } from 'react';
import { GameSettings, CustomCategory } from '../types/game';
import { Clock, Users, Eye, EyeOff, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface GameSettingsCardProps {
  settings: GameSettings;
  playerCount: number;
  isHost: boolean;
  selectedCategoryId: string;
  customCategory?: CustomCategory;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onUpdateCustomCategory?: (custom: CustomCategory) => void;
}

export const GameSettingsCard: React.FC<GameSettingsCardProps> = ({
  settings,
  playerCount,
  isHost,
  selectedCategoryId,
  customCategory,
  onUpdateSettings,
  onUpdateCustomCategory,
}) => {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState(customCategory?.name || customCategory?.title || '');
  const [customWordsText, setCustomWordsText] = useState(customCategory?.words?.join('، ') || '');

  const isCustomCategorySelected = selectedCategoryId === 'custom';

  const handleCustomCategorySave = () => {
    if (!onUpdateCustomCategory) return;
    const words = customWordsText
      .split(/[,،\n]/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    onUpdateCustomCategory({
      name: customName.trim() || (language === 'ar' ? 'فئة خاصة' : 'Custom Topic'),
      title: customName.trim() || (language === 'ar' ? 'فئة خاصة' : 'Custom Topic'),
      words:
        words.length >= 8
          ? words
          : ['كلمة 1', 'كلمة 2', 'كلمة 3', 'كلمة 4', 'كلمة 5', 'كلمة 6', 'كلمة 7', 'كلمة 8'],
    });
  };

  if (!isHost) return null;

  // Mandatory Fix #5: Safe fallback for timerSeconds
  const rawTimer = settings?.timer ?? settings?.timerDuration ?? 25;
  const timerSeconds = typeof rawTimer === 'number' && !Number.isNaN(rawTimer) ? rawTimer : 25;

  const timerLabel =
    timerSeconds === 0
      ? '∞'
      : language === 'ar'
      ? `${timerSeconds} ثانية`
      : `${timerSeconds}s`;

  const impLabel =
    !settings?.impostorCount || settings.impostorCount === 'auto'
      ? language === 'ar'
        ? 'تلقائي'
        : 'Auto'
      : `${settings.impostorCount} ${language === 'ar' ? 'إمبوستر' : 'Imp'}`;

  return (
    <div className="bg-white rounded-3xl border-3 border-black p-4 shadow-brutal transition-all w-full">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between font-black text-xs sm:text-sm text-black select-none cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span>{t('settingsTitle')}</span>
          <span className="text-[11px] bg-brand-yellow px-2.5 py-0.5 rounded-full border border-black font-black whitespace-nowrap">
            {timerLabel} • {impLabel}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t-2 border-black/10 flex flex-col gap-3 text-start animate-fade-in">
          {/* 1. Turn Timer Duration */}
          <div>
            <label className="text-xs font-black text-gray-800 flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{t('timerDurationLabel')}</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 15, label: language === 'ar' ? '15 ثانية' : '15s' },
                { val: 25, label: language === 'ar' ? '25 ثانية' : '25s' },
                { val: 45, label: language === 'ar' ? '45 ثانية' : '45s' },
                { val: 0, label: '∞' },
              ].map(({ val, label }) => {
                const isSelected = timerSeconds === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onUpdateSettings({ timer: val as any, timerDuration: val as any })}
                    className={`py-2 px-1 rounded-xl border-2 border-black text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-cyan text-black shadow-brutal-sm scale-[1.02]'
                        : 'bg-[#FAF8F5] text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Impostor Count */}
          <div>
            <label className="text-xs font-black text-gray-800 flex items-center gap-1.5 mb-1.5">
              <Users className="w-3.5 h-3.5 text-brand-pink" />
              <span>{t('impostorCountLabel')}</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 'auto', label: language === 'ar' ? 'تلقائي' : 'Auto', min: 3 },
                { val: 1, label: '1', min: 3 },
                { val: 2, label: '2', min: 5 },
                { val: 3, label: '3', min: 8 },
              ].map(({ val, label, min }) => {
                const currentImp = settings?.impostorCount ?? 'auto';
                const isSelected = currentImp === val;
                const isEligible = playerCount >= min || val === 'auto' || val === 1;

                return (
                  <button
                    key={String(val)}
                    type="button"
                    disabled={!isEligible}
                    onClick={() => isEligible && onUpdateSettings({ impostorCount: val as any })}
                    className={`py-2 px-1 rounded-xl border-2 border-black text-xs font-black transition-all ${
                      !isEligible
                        ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-brand-pink text-black shadow-brutal-sm scale-[1.02] cursor-pointer'
                        : 'bg-[#FAF8F5] text-gray-700 hover:bg-gray-100 cursor-pointer'
                    }`}
                    title={
                      !isEligible
                        ? language === 'ar'
                          ? `يحتاج ${min} لاعبين على الأقل`
                          : `Requires ${min}+ players`
                        : undefined
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Impostor Category Hint Toggle */}
          <div>
            <label className="text-xs font-black text-gray-800 flex items-center gap-1.5 mb-1.5">
              {settings?.impostorCategoryHint !== false ? (
                <Eye className="w-3.5 h-3.5 text-brand-green" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-red-500" />
              )}
              <span>{t('impostorHintLabel')}</span>
            </label>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ impostorCategoryHint: !(settings?.impostorCategoryHint !== false) })
              }
              className={`w-full p-2.5 rounded-xl border-2 border-black text-xs font-black transition-all flex items-center justify-between cursor-pointer ${
                settings?.impostorCategoryHint !== false
                  ? 'bg-brand-green/20 border-black text-green-900 shadow-brutal-sm'
                  : 'bg-red-50 border-red-500 text-red-700 shadow-brutal-sm'
              }`}
            >
              <span>
                {settings?.impostorCategoryHint !== false ? t('impostorHintOn') : t('impostorHintOff')}
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-black font-black">
                {settings?.impostorCategoryHint !== false
                  ? language === 'ar'
                    ? '✓ تلميح مفعّل'
                    : '✓ Normal'
                  : language === 'ar'
                  ? '💀 الوضع الصعب'
                  : '💀 Hardcore'}
              </span>
            </button>
          </div>

          {/* 4. Custom Category Inputs (if Custom category is active) */}
          {isCustomCategorySelected && (
            <div className="bg-[#FFF8E7] p-3 rounded-2xl border-2 border-black shadow-brutal-sm flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                <Edit3 className="w-4 h-4 text-brand-purple" />
                <span>{t('customCatTitle')}</span>
              </div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onBlur={handleCustomCategorySave}
                placeholder={
                  language === 'ar'
                    ? 'مثال: أسماء أصحابنا / ذكريات الصيف'
                    : 'e.g. Friends Nicknames / Campus Spots'
                }
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border-2 border-black rounded-lg outline-none"
              />

              <div className="text-[11px] font-black text-gray-700 mt-1">
                {t('customCatWords')}
              </div>
              <textarea
                rows={2}
                value={customWordsText}
                onChange={(e) => setCustomWordsText(e.target.value)}
                onBlur={handleCustomCategorySave}
                placeholder={t('customCatPlaceholder')}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border-2 border-black rounded-lg outline-none resize-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
