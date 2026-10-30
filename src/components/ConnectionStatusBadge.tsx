import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusBadgeProps {
  isOnline: boolean;
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  isOnline,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border-2 border-black font-black text-[10px] select-none shadow-brutal-sm transition-all ${
        isOnline
          ? 'bg-[#E8F5E9] text-green-900 border-black'
          : 'bg-[#FFF9C4] text-amber-900 border-black'
      } ${className}`}
      title={
        isOnline
          ? 'متصل بقاعدة البيانات السحابية Supabase Realtime'
          : 'يعمل بوضع المزامنة المحلية السريعة (BroadcastChannel & LocalStorage)'
      }
    >
      {isOnline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse border border-black" />
          <Wifi className="w-3 h-3 stroke-[3]" />
          <span>أونلاين (Supabase)</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-500 border border-black" />
          <WifiOff className="w-3 h-3 stroke-[2.5]" />
          <span>مزامنة محلية (Local Sync)</span>
        </>
      )}
    </div>
  );
};
