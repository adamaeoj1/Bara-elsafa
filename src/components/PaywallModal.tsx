import React, { useState } from 'react';
import { Sparkles, X, Check, Gift, Crown, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import { verifyVipCodeInDb } from '../services/supabaseService';
import { soundFx } from '../utils/soundFx';
import { useTranslation } from '../i18n/LanguageContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

const DEFAULT_MASTER_CODES = ['ADAMVIP', 'SHOWTIME2026', 'FREE100', 'ADMIN77', 'VIP', 'BARA'];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'24h' | 'monthly'>('24h');
  const [promoCode, setPromoCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const checkoutUrl = import.meta.env.VITE_PAYMENT_CHECKOUT_URL || 'https://buy.stripe.com/test_showtime_pass';

  // Gather allowed promo codes from env and defaults
  const envPromoCodes = import.meta.env.VITE_PROMO_CODES
    ? import.meta.env.VITE_PROMO_CODES.split(',').map((c: string) => c.trim().toUpperCase())
    : [];
  const validCodesSet = new Set([...DEFAULT_MASTER_CODES, ...envPromoCodes]);

  const handleApplyPromoCode = async () => {
    const clean = promoCode.trim().toUpperCase();
    if (!clean) {
      setCodeError(t('emptyPromo'));
      return;
    }

    setIsVerifying(true);
    setCodeError(null);
    setCodeSuccess(null);

    try {
      // 1. Check local master codes first
      let isValid = validCodesSet.has(clean);

      // 2. If not in local master set, check database
      if (!isValid) {
        const dbRes = await verifyVipCodeInDb(clean);
        if (dbRes.valid) isValid = true;
      }

      if (isValid) {
        soundFx.playVipCelebration();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#FFD700', '#FF80AB', '#B388FF', '#6FD8F2'],
          });
        } catch (e) {}

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('showtime_vip_unlocked', 'true');
          } catch (e) {}
        }

        setCodeSuccess(t('promoSuccess'));
        setTimeout(() => {
          onUnlockSuccess();
          onClose();
        }, 1200);
      } else {
        setCodeError(t('invalidPromo'));
      }
    } catch (e: any) {
      setCodeError(t('invalidPromo'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckoutClick = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="relative w-full max-w-sm bg-[#F7F4EB] rounded-3xl border-4 border-black p-4 shadow-brutal-xl text-center max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 end-3 w-8 h-8 bg-brand-pink rounded-full border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-black stroke-[3]" />
        </button>

        {/* Crown Header Icon */}
        <div className="w-12 h-12 mx-auto mb-2 bg-brand-yellow rounded-2xl border-3 border-black shadow-brutal flex items-center justify-center">
          <Crown className="w-7 h-7 text-black stroke-[2.5]" />
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-lg font-black text-black mb-1">
          {t('paywallTitle')}
        </h3>
        <p className="text-xs font-bold text-gray-700 leading-relaxed mb-3">
          {t('paywallDesc')}
        </p>

        {/* Promo Code Section */}
        <div className="bg-[#FFF9E6] rounded-2xl border-3 border-black p-3 text-start shadow-brutal mb-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-black text-gray-900">
            <Gift className="w-4 h-4 text-brand-purple fill-brand-purple" />
            <span>{t('promoSectionTitle')}</span>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApplyPromoCode(); }}
              placeholder={t('promoPlaceholder')}
              className="flex-1 px-3 py-1.5 text-xs font-black border-2 border-black rounded-xl uppercase tracking-wider bg-white outline-none focus:ring-2 focus:ring-black text-center"
            />
            <button
              onClick={handleApplyPromoCode}
              disabled={isVerifying}
              className="px-3 py-1.5 bg-brand-yellow hover:bg-[#ffe175] font-black text-xs rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>{isVerifying ? t('verifying') : t('applyPromoBtn')}</span>
            </button>
          </div>

          {codeError && (
            <p className="text-[11px] font-black text-red-600 mt-2 bg-red-100 p-1.5 rounded-lg border border-red-300">
              ⚠️ {codeError}
            </p>
          )}

          {codeSuccess && (
            <p className="text-[11px] font-black text-green-800 mt-2 bg-green-100 p-1.5 rounded-lg border border-green-400 animate-bounce">
              ✓ {codeSuccess}
            </p>
          )}
        </div>

        {/* Subscription Plan Cards */}
        <div className="flex flex-col gap-2 mb-3 text-start">
          {/* Plan 1: 24h Pass */}
          <div
            onClick={() => setSelectedPlan('24h')}
            className={`p-2.5 rounded-2xl border-2 sm:border-3 border-black cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === '24h'
                ? 'bg-brand-yellow shadow-brutal scale-[1.01]'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${
                selectedPlan === '24h' ? 'bg-black text-white' : 'bg-white'
              }`}>
                {selectedPlan === '24h' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-black text-black flex items-center gap-1">
                  <span>{t('plan24hTitle')}</span>
                  <span className="text-[9px] bg-black text-white px-1.5 rounded-full">{t('plan24hBadge')}</span>
                </div>
                <div className="text-[10px] font-bold text-gray-700">
                  {t('plan24hDesc')}
                </div>
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-xs sm:text-sm font-black text-black">{t('plan24hPrice')}</span>
            </div>
          </div>

          {/* Plan 2: Showtime Plus Monthly */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`p-2.5 rounded-2xl border-2 sm:border-3 border-black cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === 'monthly'
                ? 'bg-brand-purple text-white shadow-brutal scale-[1.01]'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${
                selectedPlan === 'monthly' ? 'bg-brand-yellow text-black' : 'bg-white'
              }`}>
                {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-1">
                  <span>{t('planMonthTitle')}</span>
                  <span className="text-[9px] bg-brand-pink text-black px-1.5 rounded-full">{t('planMonthBadge')}</span>
                </div>
                <div className={`text-[10px] font-bold ${selectedPlan === 'monthly' ? 'text-purple-100' : 'text-gray-700'}`}>
                  {t('planMonthDesc')}
                </div>
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-xs sm:text-sm font-black">{t('planMonthPrice')}</span>
              <span className="block text-[9px] opacity-80">{t('planMonthUnit')}</span>
            </div>
          </div>
        </div>

        {/* Primary Checkout Button */}
        <button
          onClick={handleCheckoutClick}
          className="w-full py-2.5 bg-brand-green hover:bg-[#68d778] text-black font-black text-xs rounded-xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 mb-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          <span>{t('checkoutBtn')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* Secondary Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold text-xs rounded-xl border-2 border-black cursor-pointer"
        >
          {t('closeModal')}
        </button>
      </div>
    </div>
  );
};
