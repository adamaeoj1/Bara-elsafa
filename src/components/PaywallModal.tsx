import React, { useState } from 'react';
import { Sparkles, Lock, X, Check, Gift, Crown, ExternalLink, Zap } from 'lucide-react';
import { verifyVipCodeInDb } from '../services/supabaseService';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'24h' | 'monthly'>('24h');
  const [vipCode, setVipCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const checkoutUrl = import.meta.env.VITE_PAYMENT_CHECKOUT_URL || 'https://buy.stripe.com/test_showtime_pass';

  const handleApplyVipCode = async () => {
    if (!vipCode.trim()) {
      setCodeError('يرجى إدخال الكود أولاً');
      return;
    }

    setIsVerifying(true);
    setCodeError(null);
    setCodeSuccess(null);

    try {
      const res = await verifyVipCodeInDb(vipCode);
      if (res.valid) {
        setCodeSuccess('تم تفعيل باقة VIP بنجاح! مبروك فتح جميع الفئات 🎉');
        setTimeout(() => {
          onUnlockSuccess();
          onClose();
        }, 1200);
      } else {
        setCodeError('الكود غير صالح أو منتهي الصلاحية');
      }
    } catch (e: any) {
      setCodeError('حدث خطأ أثناء فحص الكود');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-[#F7F4EB] rounded-3xl border-4 border-black p-5 shadow-brutal-xl text-center max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 bg-brand-pink rounded-full border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-black stroke-[3]" />
        </button>

        {/* Lock Crown Header */}
        <div className="w-14 h-14 mx-auto mb-3 bg-brand-yellow rounded-2xl border-3 border-black shadow-brutal flex items-center justify-center">
          <Crown className="w-8 h-8 text-black stroke-[2.5]" />
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-xl font-black text-black mb-1 flex items-center justify-center gap-1.5">
          <span>افتح كل الفئات المقفلة</span>
          <span>🔒</span>
        </h3>
        <p className="text-xs font-bold text-gray-700 leading-relaxed mb-4">
          أكثر من 6 فئات حصرية (أفلام ومسلسلات، كورة وأندية، ماركات، ألعاب فيديو...) تفتح للجميع في الغرفة فوراً!
        </p>

        {/* Plan Cards */}
        <div className="flex flex-col gap-2.5 mb-4 text-right">
          {/* Plan 1: 24h Pass */}
          <div
            onClick={() => setSelectedPlan('24h')}
            className={`p-3 rounded-2xl border-3 border-black cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === '24h'
                ? 'bg-brand-yellow shadow-brutal scale-[1.02]'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${
                selectedPlan === '24h' ? 'bg-black text-white' : 'bg-white'
              }`}>
                {selectedPlan === '24h' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-black text-black flex items-center gap-1">
                  <span>تذكرة سهرة (24 ساعة)</span>
                  <span className="text-[10px] bg-black text-white px-1.5 rounded-full">شائع</span>
                </div>
                <div className="text-[10px] font-bold text-gray-700">
                  تفتح جميع الفئات لكل اللاعبين في غرفتك لمدة يوم كامل
                </div>
              </div>
            </div>
            <div className="text-left shrink-0">
              <span className="text-sm font-black text-black">15 ر.س</span>
            </div>
          </div>

          {/* Plan 2: Showtime Plus Monthly */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`p-3 rounded-2xl border-3 border-black cursor-pointer transition-all flex items-center justify-between ${
              selectedPlan === 'monthly'
                ? 'bg-brand-purple text-white shadow-brutal scale-[1.02]'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${
                selectedPlan === 'monthly' ? 'bg-brand-yellow text-black' : 'bg-white'
              }`}>
                {selectedPlan === 'monthly' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div>
                <div className="text-xs font-black flex items-center gap-1">
                  <span>باقة شوتايم بلس (شهري)</span>
                  <span className="text-[10px] bg-brand-pink text-black px-1.5 rounded-full">VIP</span>
                </div>
                <div className={`text-[10px] font-bold ${selectedPlan === 'monthly' ? 'text-purple-100' : 'text-gray-700'}`}>
                  وصول غير محدود لجميع الفئات + غرف حتى 12 لاعب
                </div>
              </div>
            </div>
            <div className="text-left shrink-0">
              <span className="text-sm font-black">39 ر.س</span>
              <span className="block text-[9px] opacity-80">/ شهر</span>
            </div>
          </div>
        </div>

        {/* Primary Checkout Button */}
        <button
          onClick={handleCheckoutClick}
          className="w-full py-3 bg-brand-green hover:bg-[#68d778] text-black font-black text-sm rounded-xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 mb-3"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          <span>اشترك الآن والدفع بالبطاقة / Apple Pay</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        {/* VIP / Promo Code Section */}
        <div className="bg-white rounded-2xl border-2 border-black p-3 text-right shadow-brutal-sm mb-3">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-black text-gray-800">
            <Gift className="w-4 h-4 text-brand-purple" />
            <span>لديك كود تفعيل / كوبون VIP؟</span>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={vipCode}
              onChange={(e) => setVipCode(e.target.value)}
              placeholder="مثال: SHOWTIME2026 أو BARA"
              className="flex-1 px-2.5 py-1.5 text-xs font-bold border-2 border-black rounded-lg uppercase tracking-wider bg-cream outline-none focus:ring-1 focus:ring-black text-center"
            />
            <button
              onClick={handleApplyVipCode}
              disabled={isVerifying}
              className="px-3 py-1.5 bg-brand-yellow font-black text-xs rounded-lg border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
            >
              {isVerifying ? 'فحص...' : 'تفعيل ⚡'}
            </button>
          </div>

          {codeError && (
            <p className="text-[11px] font-bold text-red-600 mt-1.5">
              ⚠️ {codeError}
            </p>
          )}

          {codeSuccess && (
            <p className="text-[11px] font-bold text-green-700 mt-1.5">
              ✓ {codeSuccess}
            </p>
          )}
        </div>

        {/* Secondary Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold text-xs rounded-xl border-2 border-black"
        >
          مو الحين
        </button>
      </div>
    </div>
  );
};
