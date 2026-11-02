import React from 'react';

export const BRAND_CONFIG = {
  appNameAr: 'برا السالفة',
  appNameEn: 'Bara Elsalfa',
  subTitleAr: 'برا السالفة & المافيا',
  subTitleEn: 'Loop & Mafia',
  taglineAr: 'مين برا السالفة ومسوي فاهم؟ العبها مع أصحابك!',
  taglineEn: 'Who is out of the loop and faking it? Play with friends!',
  footerNoticeAr: 'برا السالفة • ألعاب اجتماعية جماعية مباشرة عبر المتصفح ⚡',
  footerNoticeEn: 'Bara Elsalfa • Realtime Multiplayer Social Deduction Web Game ⚡',
  vipPassNameAr: 'تذكرة VIP',
  vipPassNameEn: 'VIP Party Pass',
};

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-14 h-14 text-2xl',
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-2xl bg-brand-yellow border-2 sm:border-3 border-black shadow-brutal-sm flex items-center justify-center font-black select-none shrink-0 ${className}`}
    >
      <span role="img" aria-label="Brand Logo">
        🎭
      </span>
    </div>
  );
};
