import React, { useEffect } from 'react';
import { Player } from '../../types/game';
import { PlayerPawn } from '../PlayerPawn';
import { useTranslation } from '../../i18n/LanguageContext';
import { Check, Users, Moon, Zap } from 'lucide-react';

interface MafiaVotingPhaseProps {
  player: Player;
  players: Player[];
  votes: Record<string, string>;
  votingRevealed: boolean;
  exiledPlayerId?: string | null;
  isHost: boolean;
  onSubmitVote: (voterId: string, targetId: string) => void;
  onForceResolve?: () => void;
  onStartNextNight: () => void;
}

export const MafiaVotingPhase: React.FC<MafiaVotingPhaseProps> = ({
  player,
  players,
  votes,
  votingRevealed,
  exiledPlayerId,
  isHost,
  onSubmitVote,
  onForceResolve,
  onStartNextNight,
}) => {
  const { t, language } = useTranslation();

  const isLiving = player.is_alive !== false && player.isAlive !== false;

  // Mandatory Fix #3: Calculate activeVoters and votesCast directly from active players' voted_for
  const activeVoters = players.filter((p) => p.is_alive !== false && p.isAlive !== false);
  const votesCast = activeVoters.filter((p) => {
    const val = p.voted_for ?? p.votedTargetId ?? votes[p.id];
    return val !== null && val !== undefined && val !== '';
  });

  const myVote = player.voted_for ?? player.votedTargetId ?? votes[player.id] ?? null;
  const allVoted = activeVoters.length > 0 && votesCast.length >= activeVoters.length;

  // Component-level Auto-Resolution Guarantee
  useEffect(() => {
    if (allVoted && !votingRevealed && onForceResolve) {
      const timer = setTimeout(() => {
        onForceResolve();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allVoted, votingRevealed, onForceResolve]);

  const exiledPlayer = exiledPlayerId ? players.find((p) => p.id === exiledPlayerId) : null;

  return (
    <div className="flex flex-col items-center justify-between w-full gap-4 select-none animate-fade-in pb-2">
      {/* 1. Header & Progress */}
      <div className="w-full bg-white rounded-3xl border-3 border-black p-4 shadow-brutal flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow border-2 border-black shadow-brutal-xs flex items-center justify-center text-xl">
              ⚖️
            </div>
            <div className="text-start">
              <h3 className="text-sm sm:text-base font-black text-black">
                {t('courtTitle')}
              </h3>
              <span className="text-xs text-gray-500 font-bold block">
                {votingRevealed
                  ? language === 'ar'
                    ? 'نتائج التصويت الرسمية'
                    : 'Official Court Results'
                  : t('votingNote')}
              </span>
            </div>
          </div>

          {/* Voting count badge: ${votesCast.length}/${activeVoters.length} */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] rounded-xl border-2 border-black font-mono font-black text-xs sm:text-sm text-black">
            <Users className="w-4 h-4" />
            <span>
              {votesCast.length}/{activeVoters.length}
            </span>
          </div>
        </div>

        {/* Live Vote Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 border border-black overflow-hidden">
          <div
            className="bg-brand-green h-full transition-all duration-300"
            style={{ width: `${(votesCast.length / Math.max(1, activeVoters.length)) * 100}%` }}
          />
        </div>
      </div>

      {/* 2. Court Results State (Voting Revealed) */}
      {votingRevealed ? (
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          {exiledPlayer ? (
            /* Player Exiled */
            <div className="bg-[#FFF8E7] rounded-3xl border-3 border-black p-5 shadow-brutal text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border-2 border-red-500 flex items-center justify-center text-2xl mx-auto mb-2 shadow-brutal-xs">
                ⚖️
              </div>
              <h3 className="text-base sm:text-lg font-black text-black">
                {t('playerExiled', {
                  name: exiledPlayer.name,
                  role:
                    exiledPlayer.mafiaRole === 'IMPOSTOR' || exiledPlayer.isImpostor
                      ? '🔪 إمبوستر (قاتل)'
                      : exiledPlayer.mafiaRole === 'DOCTOR'
                      ? '🩺 دكتور'
                      : exiledPlayer.mafiaRole === 'DETECTIVE'
                      ? '🕵️‍♂️ محقق'
                      : '🛡️ مواطن بريء',
                })}
              </h3>
              <div className="my-3 flex justify-center">
                <PlayerPawn
                  color={exiledPlayer.color}
                  name={exiledPlayer.name}
                  isDead={true}
                  size="md"
                />
              </div>
              <p className="text-xs sm:text-sm font-black text-gray-800 bg-white rounded-xl p-2.5 border-2 border-black">
                {exiledPlayer.mafiaRole === 'IMPOSTOR' || exiledPlayer.isImpostor
                  ? language === 'ar'
                    ? 'ضربة موفقة! تم التخلص من أحد أفراد الإمبوستر بنجاح! 🎯'
                    : 'Great hit! One Impostor has been eliminated! 🎯'
                  : language === 'ar'
                  ? 'يا للأسف! لقد نفت المدينة شخصاً بريئاً! 💔'
                  : 'Alas! The town exiled an innocent citizen! 💔'}
              </p>
            </div>
          ) : (
            /* Skip Tie / Majority Rule: Nobody is exiled */
            <div className="bg-white rounded-3xl border-3 border-black p-5 shadow-brutal text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow border-2 border-black flex items-center justify-center text-2xl mx-auto mb-2 shadow-brutal-xs">
                🕊️
              </div>
              <h3 className="text-lg font-black text-black leading-snug">
                {language === 'ar' ? 'قررت المحكمة عدم نفي أي شخص!' : 'The Court decided not to exile anyone!'}
              </h3>
              <p className="text-xs font-bold text-gray-600 mt-1">
                {t('noOneExiled')}
              </p>
            </div>
          )}

          {/* Host Next Night Button */}
          {isHost ? (
            <button
              onClick={onStartNextNight}
              className="w-full py-3.5 bg-[#1E1B2E] hover:bg-[#2c2842] text-white font-black text-base rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Moon className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
              <span>{t('nextNightBtn')}</span>
            </button>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-black p-3 text-center shadow-brutal-sm">
              <span className="text-xs font-black text-gray-700 animate-pulse">
                {language === 'ar'
                  ? '⏳ في انتظار المضيف لبدء الليلة التالية...'
                  : '⏳ Waiting for Host to start the next night...'}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* 3. Secret Voting Grid (Voting in Progress) */
        <div className="w-full bg-white rounded-3xl border-3 border-black p-4 sm:p-5 shadow-brutal flex flex-col justify-between gap-3">
          {isLiving ? (
            <>
              <span className="text-xs sm:text-sm font-black text-gray-800 block text-start">
                {t('courtSubtitle')}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeVoters.map((suspect) => {
                  const isSelected = myVote === suspect.id;
                  const isMe = suspect.id === player.id;
                  const isDisabled = isMe;

                  return (
                    <button
                      key={suspect.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && onSubmitVote(player.id, suspect.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'bg-[#FAD85D] border-black font-black shadow-brutal scale-[1.01]'
                          : isMe
                          ? 'bg-gray-100 border-black/20 opacity-60 cursor-not-allowed font-bold'
                          : 'bg-[#FAF8F5] border-black hover:bg-[#FFF8E7] font-bold cursor-pointer active:translate-x-[1px] active:translate-y-[1px]'
                      }`}
                    >
                      <PlayerPawn color={suspect.color} size="sm" showName={false} isActive={true} />
                      <div className="flex-1 truncate text-start">
                        <span className="text-xs sm:text-sm font-black text-black block truncate">
                          {suspect.name} {isMe && (language === 'ar' ? '(أنت)' : '(You)')}
                        </span>
                        {isSelected ? (
                          <span className="text-[10px] font-black text-black bg-white px-2 py-0.5 rounded-md border border-black inline-block mt-0.5">
                            {language === 'ar' ? 'تم تسجيل صوتك ✓' : 'Vote Recorded ✓'}
                          </span>
                        ) : isMe ? (
                          <span className="text-[10px] text-gray-500 font-bold block">
                            {language === 'ar' ? 'لا يمكنك التصويت لنفسك' : 'Cannot vote self'}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Skip Vote Button */}
              <button
                type="button"
                onClick={() => onSubmitVote(player.id, 'SKIP')}
                className={`w-full py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  myVote === 'SKIP'
                    ? 'bg-[#FAD85D] border-black font-black shadow-brutal'
                    : 'bg-white border-black hover:bg-gray-50 font-bold active:translate-x-[1px] active:translate-y-[1px]'
                }`}
              >
                <span>🕊️</span>
                <span className="text-xs sm:text-sm font-black">
                  {myVote === 'SKIP'
                    ? language === 'ar'
                      ? 'تم تسجيل صوتك (تخطي) ✓'
                      : 'Vote Recorded (Skip) ✓'
                    : t('skipVoteBtn')}
                </span>
                {myVote === 'SKIP' && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
            </>
          ) : (
            /* Ghost Spectator Message */
            <div className="text-center py-6">
              <span className="text-4xl block mb-2">👻</span>
              <h4 className="text-sm font-black text-black">
                {language === 'ar' ? 'أنت شبح متفرج' : 'You are a Ghost Spectator'}
              </h4>
              <p className="text-xs text-gray-500 font-bold mt-1">
                {t('ghostSpectatorNotice')}
              </p>
            </div>
          )}

          {/* Manual Host Fallback Button if all players voted */}
          {isHost && allVoted && onForceResolve && (
            <button
              type="button"
              onClick={onForceResolve}
              className="w-full mt-2 py-3 bg-brand-green hover:bg-[#68d778] text-black font-black text-sm rounded-2xl border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{language === 'ar' ? 'إظهار نتائج التصويت ⚡' : 'Reveal Vote Results ⚡'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
