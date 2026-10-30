import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Copy, Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  roomCode,
}) => {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : `https://bara-elsafa.vercel.app/?room=${roomCode}`;

  useEffect(() => {
    if (isOpen && roomCode) {
      QRCode.toDataURL(roomUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR Code:', err));
    }
  }, [isOpen, roomCode, roomUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-sm bg-[#F7F4EB] rounded-3xl border-4 border-black p-5 shadow-brutal-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 bg-brand-pink rounded-full border-2 border-black flex items-center justify-center shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] transition-all"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-black stroke-[3]" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto mb-3 bg-brand-cyan rounded-2xl border-3 border-black shadow-brutal flex items-center justify-center">
          <QrCode className="w-8 h-8 text-black stroke-[2.5]" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-black mb-1">
          {t('qrModalTitle')}
        </h3>
        <p className="text-xs font-bold text-gray-700 leading-relaxed mb-4 px-2">
          {t('qrModalDesc')}
        </p>

        {/* Scannable QR Code Card */}
        <div className="bg-white p-3.5 rounded-2xl border-3 border-black shadow-brutal max-w-[260px] mx-auto mb-4 flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for room ${roomCode}`}
              className="w-56 h-56 rounded-lg select-none"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs font-bold text-gray-400 animate-pulse">
              Generating QR...
            </div>
          )}

          <div className="mt-2 text-center">
            <span className="text-[11px] font-black text-gray-500 block">
              {t('roomLabel')}
            </span>
            <span className="text-2xl font-black font-mono tracking-widest text-brand-purple">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 bg-brand-yellow hover:bg-[#ffe175] text-black font-black text-xs rounded-xl border-2 border-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 transition-all"
        >
          {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2]" />}
          <span>{copied ? t('linkCopied') : t('copyLink')}</span>
        </button>
      </div>
    </div>
  );
};
