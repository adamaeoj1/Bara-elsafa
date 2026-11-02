import React, { useState } from 'react';
import { Player } from '../types/game';
import { PlayerPawn } from './PlayerPawn';
import { useTranslation } from '../i18n/LanguageContext';
import { soundFx } from '../utils/soundFx';
import { Dices, Check, X, Sparkles } from 'lucide-react';

interface PunishmentWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  loser?: Player | null;
}

interface DareItem {
  id: string;
  textAr: string;
  textEn: string;
  icon: string;
}

const DARES: DareItem[] = [
  {
    id: 'dare_classical_arabic',
    textAr: 'يتكلم باللغة العربية الفصحى فقط طوال الجولة القادمة!',
    textEn: 'Speak only in formal Classical Arabic (or Shakespearean English) next round!',
    icon: '📜',
  },
  {
    id: 'dare_treat_tea',
    textAr: 'يعزم صاحب المركز الأول على كاس أتاي أو قهوة!',
    textEn: 'Buy Moroccan mint tea or coffee for the 1st place winner!',
    icon: '🫖',
  },
  {
    id: 'dare_no_yes_no',
    textAr: 'يُمنع من قول كلمة (لا) أو (أه / إيه) في الجولة الجاية تماماً!',
    textEn: 'Forbidden from saying "Yes" or "No" throughout the next round!',
    icon: '🤐',
  },
  {
    id: 'dare_one_leg',
    textAr: 'يوقف على رجل واحدة طوال مرحلة الأسئلة القادمة!',
    textEn: 'Stand on one leg during the entire next Questions phase!',
    icon: '🦩',
  },
  {
    id: 'dare_poetic_praise',
    textAr: 'يمدح الفائز بـ 3 جمل شعرية وغزلية الحين!',
    textEn: 'Praise the winner with 3 poetic sentences right now!',
    icon: '🌹',
  },
  {
    id: 'dare_robot_voice',
    textAr: 'يقلد صوت روبوت في كل جملة يقولها الجولة الجاية!',
    textEn: 'Talk like an emotionless robot in every sentence next round!',
    icon: '🤖',
  },
  {
    id: 'dare_funny_confession',
    textAr: 'يعترف بأغرب وأطرف موقف صار له قدام الكل!',
    textEn: 'Confess the funniest or weirdest story that ever happened to you!',
    icon: '😂',
  },
  {
    id: 'dare_blind_discussion',
    textAr: 'يغمض عينيه لمدة دقيقة كاملة أثناء النقاش القادم!',
    textEn: 'Keep your eyes closed for one full minute during the next discussion!',
    icon: '🙈',
  },
  {
    id: 'dare_news_anchor',
    textAr: 'يقدم نشرة أخبار درامية عاجلة تشرح كيف خسر الجولة!',
    textEn: 'Deliver a dramatic breaking news bulletin about how they lost the round!',
    icon: '🎙️',
  },
];

export const PunishmentWheelModal: React.FC<PunishmentWheelModalProps> = ({
  isOpen,
  onClose,
  loser,
}) => {
  const { t, language } = useTranslation();
  const [selectedDareIndex, setSelectedDareIndex] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentDare = DARES[selectedDareIndex];

  const handleSpinDare = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    soundFx.playDareSpin();

    let spins = 0;
    const interval = setInterval(() => {
      setSelectedDareIndex((prev) => (prev + 1) % DARES.length);
      spins++;
      if (spins >= 10) {
        clearInterval(interval);
        const finalIndex = Math.floor(Math.random() * DARES.length);
        setSelectedDareIndex(finalIndex);
        setIsSpinning(false);
      }
    }, 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-3xl border-3 sm:border-4 border-black p-4 sm:p-5 shadow-brutal-xl max-w-sm w-full flex flex-col items-center gap-3.5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 left-3.5 sm:left-4 p-1.5 rounded-xl border-2 border-black hover:bg-gray-100 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex flex-col items-center text-center mt-1">
          <div className="w-12 h-12 rounded-2xl bg-brand-pink border-3 border-black shadow-brutal-sm flex items-center justify-center text-2xl mb-1.5">
            🎡
          </div>
          <h3 className="text-xl font-black text-black">
            {t('dareModalTitle')}
          </h3>
          <p className="text-[11px] font-bold text-gray-500">
            {t('dareModalSubtitle')}
          </p>
        </div>

        {/* Loser Highlight */}
        {loser && (
          <div className="w-full bg-[#FAF8F5] rounded-2xl border-2 border-black p-2.5 flex items-center justify-center gap-3 shadow-brutal-xs">
            <span className="text-xs font-black text-gray-600">
              {t('loserIs')}
            </span>
            <div className="flex items-center gap-1.5 bg-brand-pink/20 px-2.5 py-1 rounded-xl border border-black/30">
              <PlayerPawn
                color={loser.color}
                size="sm"
                isActive={true}
                showName={false}
              />
              <span className="font-black text-xs text-black">
                {loser.name}
              </span>
            </div>
          </div>
        )}

        {/* The Dare Card */}
        <div
          className={`w-full bg-brand-yellow/25 rounded-2xl border-3 border-black p-4 text-center shadow-brutal transition-all duration-150 ${
            isSpinning ? 'scale-95 opacity-75' : 'scale-100 opacity-100'
          }`}
        >
          <div className="text-3xl mb-1.5">{currentDare.icon}</div>
          <p className="text-sm sm:text-base font-black text-black leading-snug">
            {language === 'ar' ? currentDare.textAr : currentDare.textEn}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 w-full mt-1">
          <button
            onClick={handleSpinDare}
            disabled={isSpinning}
            className="w-full py-3 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-sm rounded-2xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Dices className={`w-4 h-4 stroke-[2.5] ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{t('spinAnotherDare')}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-brand-green hover:bg-[#68d778] text-black font-black text-xs rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('dareExecuted')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
