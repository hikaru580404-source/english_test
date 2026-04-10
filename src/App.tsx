/**
 * @license
 * SwipeSprint 8 - Mobile Master Fluid Edition
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Trophy, 
  Timer, 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  XCircle,
  BrainCircuit,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

// --- 中学2年生 必須単語データセット (50語) ---
const WORDS = [
  { id: 1, english: 'Experience', japanese: '経験', pos: 'Noun' },
  { id: 2, english: 'Believe', japanese: '信じる', pos: 'Verb' },
  { id: 3, english: 'Evaluate', japanese: '評価する', pos: 'Verb' },
  { id: 4, english: 'Implementation', japanese: '実装', pos: 'Noun' },
  { id: 5, english: 'Requirement', japanese: '要件', pos: 'Noun' },
  { id: 6, english: 'Decision', japanese: '決定', pos: 'Noun' },
  { id: 7, english: 'Imagine', japanese: '想像する', pos: 'Verb' },
  { id: 8, english: 'Support', japanese: '支持する', pos: 'Verb' },
  { id: 9, english: 'Improve', japanese: '改善する', pos: 'Verb' },
  { id: 10, english: 'Important', japanese: '重要な', pos: 'Adj' },
  { id: 11, english: 'Possible', japanese: '可能な', pos: 'Adj' },
  { id: 12, english: 'Necessary', japanese: '必要な', pos: 'Adj' },
  { id: 13, english: 'Understand', japanese: '理解する', pos: 'Verb' },
  { id: 14, english: 'Explain', japanese: '説明する', pos: 'Verb' },
  { id: 15, english: 'Information', japanese: '情報', pos: 'Noun' },
  { id: 16, english: 'Traditional', japanese: '伝統的な', pos: 'Adj' },
  { id: 17, english: 'Protect', japanese: '守る', pos: 'Verb' },
  { id: 18, english: 'Difference', japanese: '違い', pos: 'Noun' },
  { id: 19, english: 'Discovery', japanese: '発見', pos: 'Noun' },
  { id: 20, english: 'Popular', japanese: '人気のある', pos: 'Adj' },
  { id: 21, english: 'Communicate', japanese: '伝える', pos: 'Verb' },
  { id: 22, english: 'Government', japanese: '政府', pos: 'Noun' },
  { id: 23, english: 'Environment', japanese: '環境', pos: 'Noun' },
  { id: 24, english: 'Success', japanese: '成功', pos: 'Noun' },
  { id: 25, english: 'Adventure', japanese: '冒険', pos: 'Noun' },
  { id: 26, english: 'Medicine', japanese: '薬', pos: 'Noun' },
  { id: 27, english: 'Opposite', japanese: '反対の', pos: 'Adj' },
  { id: 28, english: 'Reason', japanese: '理由', pos: 'Noun' },
  { id: 29, english: 'Schedule', japanese: '予定', pos: 'Noun' },
  { id: 30, english: 'Volunteer', japanese: 'ボランティア', pos: 'Noun' },
  { id: 31, english: 'Quality', japanese: '質', pos: 'Noun' },
  { id: 32, english: 'Memory', japanese: '記憶', pos: 'Noun' },
  { id: 33, english: 'Opinion', japanese: '意見', pos: 'Noun' },
  { id: 34, english: 'Patient', japanese: '忍耐強い', pos: 'Adj' },
  { id: 35, english: 'Recognize', japanese: '認識する', pos: 'Verb' },
  { id: 36, english: 'Journey', japanese: '旅', pos: 'Noun' },
  { id: 37, english: 'Knowledge', japanese: '知識', pos: 'Noun' },
  { id: 38, english: 'Language', japanese: '言語', pos: 'Noun' },
  { id: 39, english: 'Education', japanese: '教育', pos: 'Noun' },
  { id: 40, english: 'Brave', japanese: '勇敢な', pos: 'Adj' },
  { id: 41, english: 'Awful', japanese: 'ひどい', pos: 'Adj' },
  { id: 42, english: 'Comfortable', japanese: '快適な', pos: 'Adj' },
  { id: 43, english: 'Destroy', japanese: '破壊する', pos: 'Verb' },
  { id: 44, english: 'Notice', japanese: '気づく', pos: 'Verb' },
  { id: 45, english: 'Foreign', japanese: '外国の', pos: 'Adj' },
  { id: 46, english: 'Harvest', japanese: '収穫', pos: 'Noun' },
  { id: 47, english: 'Produce', japanese: '生産する', pos: 'Verb' },
  { id: 48, english: 'Understand', japanese: '理解する', pos: 'Verb' },
  { id: 49, english: 'Condition', japanese: '状態', pos: 'Noun' },
  { id: 50, english: 'Excellent', japanese: '優れた', pos: 'Adj' },
];

type GameState = 'START' | 'PLAYING' | 'FINISHED';
type DirectionMode = 'EN_TO_JP' | 'JP_TO_EN';

interface QuizResult {
  word: typeof WORDS[0];
  isCorrect: boolean;
  userMastery: 'remembered' | 'unsure';
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [direction, setDirection] = useState<DirectionMode>('EN_TO_JP');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizOptions, setQuizOptions] = useState<{left: string, right: string}>({left: '', right: ''});
  const [shuffledQueue, setShuffledQueue] = useState<typeof WORDS>([]);

  // --- Physical Motion Values ---
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-45, 45]);
  const opacity = useTransform(x, [-300, -250, 0, 250, 300], [0, 1, 1, 1, 0]);
  const y = useTransform(x, (latest) => -Math.abs(latest) * 0.3); // 浮遊感：カードを上に浮かせる
  const scale = useTransform(x, [-150, 0, 150], [1.05, 1, 1.05]);

  // Choice Label Overlays (カード内部表示用)
  const leftOverlayOpacity = useTransform(x, [-160, -40], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [40, 160], [0, 1]);

  const generateOptions = useCallback((correctWord: typeof WORDS[0], mode: DirectionMode) => {
    const correctVal = mode === 'EN_TO_JP' ? correctWord.japanese : correctWord.english;
    const others = WORDS.filter(w => w.id !== correctWord.id);
    const wrongWord = others[Math.floor(Math.random() * others.length)];
    const wrongVal = mode === 'EN_TO_JP' ? wrongWord.japanese : wrongWord.english;
    
    const isCorrectOnRight = Math.random() > 0.5;
    return isCorrectOnRight 
      ? { right: correctVal, left: wrongVal } 
      : { right: wrongVal, left: correctVal };
  }, []);

  const startGame = () => {
    const queue = [...WORDS].sort(() => Math.random() - 0.5);
    setShuffledQueue(queue);
    setResults([]);
    setCurrentIndex(0);
    setTimeLeft(180);
    setQuizOptions(generateOptions(queue[0], direction));
    setGameState('PLAYING');
  };

  const handleSwipe = (swipeDir: 'right' | 'left') => {
    const currentWord = shuffledQueue[currentIndex % shuffledQueue.length];
    const correctVal = direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english;
    const selectedVal = swipeDir === 'right' ? quizOptions.right : quizOptions.left;
    const isCorrect = selectedVal === correctVal;

    if (window.navigator.vibrate) window.navigator.vibrate(60);

    setResults(prev => [...prev, { word: currentWord, isCorrect, userMastery: 'unsure' }]);
    
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setQuizOptions(generateOptions(shuffledQueue[nextIdx % shuffledQueue.length], direction));
    x.set(0);
  };

  const toggleMastery = (index: number, status: 'remembered' | 'unsure') => {
    setResults(prev => prev.map((item, i) => i === index ? { ...item, userMastery: status } : item));
    if (window.navigator.vibrate) window.navigator.vibrate(30);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      setGameState('FINISHED');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between bg-slate-50 font-sans overflow-hidden select-none relative pb-safe antialiased">
      
      {/* Visual Ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-rose-50/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- START --- */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center w-full max-w-sm px-6 text-center space-y-12 z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-xl">
                <Sparkles size={12} className="text-blue-400" /> MMC Educations
              </div>
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Swipe<span className="text-blue-600 font-black">Sprint</span><span className="text-blue-500 opacity-50 text-5xl font-black ml-1">8</span>
              </h1>
              <p className="text-slate-400 font-bold text-lg">物理演算スワイプで英単語を習得</p>
            </div>

            <div className="w-full bg-white/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-white shadow-2xl space-y-8">
              <div className="flex bg-slate-200/50 p-2 rounded-2xl gap-2 shadow-inner border border-white/50">
                <button onClick={() => setDirection('EN_TO_JP')} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${direction === 'EN_TO_JP' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  英 → 日
                </button>
                <button onClick={() => setDirection('JP_TO_EN')} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${direction === 'JP_TO_EN' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  日 → 英
                </button>
              </div>
              <button onClick={startGame} className="w-full py-8 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                <Play size={28} fill="currentColor" /> START
              </button>
            </div>
          </motion.div>
        )}

        {/* --- PLAYING --- */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md h-[100dvh] flex flex-col items-center justify-between p-4 z-10 overflow-hidden">
            
            {/* Header - Fixed layout */}
            <div className="w-full flex justify-between items-center bg-white/90 backdrop-blur-2xl px-6 py-4 rounded-[2rem] shadow-xl border border-white/50 mt-2">
              <div className="flex items-center gap-3 text-slate-900 font-black text-2xl tabular-nums">
                <Timer className="text-blue-600" size={24} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="px-5 py-1.5 bg-blue-50 text-blue-600 rounded-full font-black text-xs uppercase border border-blue-100">
                Q.{results.length + 1}
              </div>
            </div>

            {/* Floating Card UI - Centered */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-visible">
              
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, y, rotate, opacity, scale }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 140) handleSwipe('right');
                  else if (info.offset.x < -140) handleSwipe('left');
                }}
                whileGrab={{ cursor: 'grabbing' }}
                className="relative z-20 w-[min(90%,360px)] aspect-[3/4.5] bg-white rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.3)] border border-white flex flex-col items-center justify-center p-8 touch-none"
              >
                {/* CHOICE OVERLAYS - 極太・濃い文字（カード内に配置し、はみ出しを解消） */}
                <motion.div style={{ opacity: leftOverlayOpacity }} className="absolute inset-0 bg-rose-600 rounded-[4rem] flex flex-col items-center justify-center p-8 z-30 pointer-events-none border-4 border-rose-400">
                  <ChevronLeft size={80} className="text-white mb-4" strokeWidth={6} />
                  <span className="text-white text-5xl font-black text-center leading-none tracking-tighter break-words max-w-full drop-shadow-2xl">{quizOptions.left}</span>
                </motion.div>

                <motion.div style={{ opacity: rightOverlayOpacity }} className="absolute inset-0 bg-emerald-600 rounded-[4rem] flex flex-col items-center justify-center p-8 z-30 pointer-events-none border-4 border-emerald-400">
                  <ChevronRight size={80} className="text-white mb-4" strokeWidth={6} />
                  <span className="text-white text-5xl font-black text-center leading-none tracking-tighter break-words max-w-full drop-shadow-2xl">{quizOptions.right}</span>
                </motion.div>

                {/* WORD INFO - CENTERED */}
                <div className="text-center space-y-10 flex flex-col items-center justify-center">
                  <span className="text-blue-600 font-black tracking-[0.5em] text-[10px] uppercase bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                    {shuffledQueue[currentIndex % shuffledQueue.length]?.pos}
                  </span>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter break-words max-w-full">
                    {direction === 'EN_TO_JP' 
                      ? shuffledQueue[currentIndex % shuffledQueue.length]?.english 
                      : shuffledQueue[currentIndex % shuffledQueue.length]?.japanese}
                  </h2>
                </div>

                {/* GUIDE LABELS - BOTTOM */}
                <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-50 w-full px-8">
                   <div className="flex justify-between w-full text-slate-900 font-black text-[10px] uppercase tracking-tighter">
                     <span className="flex items-center gap-1"><ChevronLeft size={10} /> {quizOptions.left}</span>
                     <span className="flex items-center gap-1">{quizOptions.right} <ChevronRight size={10} /></span>
                   </div>
                   <div className="w-16 h-1 bg-slate-100 rounded-full" />
                </div>
              </motion.div>
            </div>

            <div className="h-4" /> {/* Bottom spacer */}
          </motion.div>
        )}

        {/* --- FINISHED --- */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl min-h-[100dvh] p-6 flex flex-col items-center justify-between z-10 py-10 overflow-y-auto">
            <div className="text-center space-y-3 py-4">
              <Trophy size={64} className="mx-auto text-orange-400 drop-shadow-xl animate-bounce" />
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Mission Clear!</h2>
              <p className="text-slate-500 font-bold text-lg">学習結果を仕分けましょう</p>
            </div>

            <div className="w-full bg-white/80 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-2xl overflow-hidden p-3 md:p-6 mb-8 flex-1">
              <div className="max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar px-2 py-4">
                {results.map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-between bg-white p-6 rounded-[2.5rem] border border-slate-100 gap-6 transition-all hover:border-blue-200 shadow-sm">
                    <div className="flex items-center gap-5 w-full">
                      {item.isCorrect 
                        ? <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm"><CheckCircle2 size={32} strokeWidth={4} /></div> 
                        : <div className="p-3 bg-rose-100 rounded-2xl text-rose-500 shadow-sm"><XCircle size={32} strokeWidth={4} /></div>
                      }
                      <div className="flex-1">
                        <div className="text-2xl font-black text-slate-900 leading-tight">{item.word.english}</div>
                        <div className="text-sm text-slate-400 font-black tracking-wide uppercase">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    <div className="flex bg-slate-50 p-1.5 rounded-3xl border border-slate-200 w-full shadow-inner">
                      <button onClick={() => toggleMastery(i, 'remembered')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-black text-xs transition-all ${item.userMastery === 'remembered' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300'}`}>
                        <BrainCircuit size={18} /> 覚えた
                      </button>
                      <button onClick={() => toggleMastery(i, 'unsure')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-black text-xs transition-all ${item.userMastery === 'unsure' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-300'}`}>
                        <HelpCircle size={18} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 shadow-2xl hover:bg-black transition-all active:scale-95">
              <RotateCcw size={28} /> SAVE & RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f8fafc; margin: 0; padding: 0; }
        * { touch-action: manipulation; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </div>
  );
}
