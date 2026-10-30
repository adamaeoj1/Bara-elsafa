import React from 'react';
import { Sparkles, Lock, X } from 'lucide-react';

interface LockedCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
}

export const LockedCategoryModal: React.FC<LockedCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-brand-cream bg-[#F7F4EB] rounded-2xl border-4 border-black p-6 shadow-brutal-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -left-3 w-9 h-9 bg-brand-pink rounded-full border-2 border-black flex items-center justify-center shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5 text-black stroke-[3]" />
        </button>

        {/* Lock Icon Header */}
        <div className="w-16 h-16 mx-auto mb-4 bg-brand-yellow rounded-2xl border-3 border-black shadow-brutal flex items-center justify-center">
          <Lock className="w-9 h-9 text-black stroke-[2.5]" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-black mb-2 flex items-center justify-center gap-2">
          <span>افتح كل الفئات</span>
          <span className="text-xl">🔒</span>
        </h3>

        {/* Body Text */}
        <p className="text-sm font-bold text-gray-800 leading-relaxed mb-6 px-2">
          21 فئة مقفلة، تقدر تفتحها كلها عن طريق الاشتراك!
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (onSubscribe) onSubscribe();
              onClose();
            }}
            className="w-full py-3 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-base rounded-xl border-3 border-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 fill-black" />
            <span>اشترك</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white hover:bg-gray-100 text-black font-bold text-sm rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            مو الحين
          </button>
        </div>
      </div>
    </div>
  );
};
