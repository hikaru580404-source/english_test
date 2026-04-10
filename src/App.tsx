/**
 * @license
 * SwipeSprint 8 - Full Screen Fluid Edition
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Trophy, 
  Timer, 
  RotateCcw, 
  Play, 
  Pause,
  CheckCircle2, 
  XCircle,
  BrainCircuit,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

// --- 中学2年生 必須単語データセット ---
const WORDS = [
  { id: 1, english: 'Experience', japanese: '経験' },
  { id: 2, english: 'Believe', japanese: '信じる' },
  { id: 3, english: 'Evaluate', japanese: '評価する' },
  { id: 4, english: 'Implementation', japanese: '実装' },
  { id: 5, english: 'Requirement', japanese: '要件' },
  { id: 6, english: 'Decision', japanese: '決定' },
  { id: 7, english: 'Imagine', japanese: '想像する' },
  { id: 8, english: 'Support', japanese: '支持する' },
  { id: 9, english: 'Improve', japanese: '改善する' },
  { id: 10, english: 'Important', japanese: '重要な' },
  { id: 11, english: 'Possible', japanese: '可能な' },
  { id: 12, english: 'Necessary', japanese: '必要な' },
  { id: 13, english: 'Understand', japanese: '理解する' },
  { id: 14, english: 'Explain', japanese: '説明する' },
  { id: 15, english: 'Information', japanese: '情報' },
  { id: 16, english: 'Traditional', japanese: '伝統的な' },
  { id: 17, english: 'Protect', japanese: '守る' },
  { id: 18, english: 'Difference', japanese: '違い' },
  { id: 19, english: 'Discovery', japanese: '発見' },
  { id: 20, english: 'Popular', japanese: '人気のある' },
  { id: 21, english: 'Communicate', japanese: '伝える' },
  { id: 22, english: 'Government', japanese: '政府' },
  { id: 23, english: 'Environment', japanese: '環境' },
  { id: 24, english: 'Success', japanese: '成功' },
  { id: 25, english: 'Adventure', japanese: '冒険' },
  { id: 26, english: 'Medicine', japanese: '薬' },
  { id: 27, english: 'Opposite', japanese: '反対の' },
  { id: 28, english: 'Reason', japanese: '理由' },
  { id: 29, english: 'Schedule', japanese: '予定' },
  { id: 30, english: 'Volunteer', japanese: 'ボランティア' },
  { id: 31, english: 'Quality', japanese: '質' },
  { id: 32, english: 'Memory', japanese: '記憶' },
  { id: 33, english: 'Opinion', japanese: '意見' },
  { id: 34, english: 'Patient', japanese: '忍耐強い' },
  { id: 35, english: 'Recognize', japanese: '認識する' },
  { id: 36, english: 'Journey', japanese: '旅' },
  { id: 37, english: 'Knowledge', japanese: '知識' },
  { id: 38, english: 'Language', japanese: '言語' },
  { id: 39, english: 'Education', japanese: '教育' },
  { id: 40, english: 'Brave', japanese: '勇敢な' },
  { id: 41, english: 'Awful', japanese: 'ひどい' },
  { id: 42, english: 'Comfortable', japanese: '快適な' },
  { id: 43, english: 'Destroy', japanese: '破壊する' },
  { id: 44, english: 'Notice', japanese: '気づく' },
  { id: 45, english: 'Foreign', japanese: '外国の' },
  { id: 46, english: 'Harvest', japanese: '収穫' },
  { id: 47, english: 'Produce', japanese: '生産する' },
  { id: 48, english: 'Condition', japanese: '状態' },
  { id: 49, english: 'Excellent', japanese: '優れた' },
  { id: 50, english: 'Century', japanese: '世紀' },
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
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizOptions, setQuizOptions] = useState<{left: string, right: string}>({left: '', right: ''});
  const [shuffledQueue, setShuffledQueue] = useState<typeof WORDS>([]);

  // --- Physical Motion Values ---
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-60, 60]); 
  const opacity = useTransform(x, [-350, -250, 0, 250, 350], [0, 1, 1, 1, 0]);
  const y = useTransform(x, (latest) => -Math.abs(latest) * 0.4); 
  const scale = useTransform(x, [-200, 0, 200], [1.1, 1, 1.1]);

  const leftOverlayOpacity = useTransform(x, [-200, -50], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [50, 200], [0, 1]);

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
    setIsPaused(false);
    setQuizOptions(generateOptions(queue[0], direction));
    setGameState('PLAYING');
  };

  const handleSwipe = (swipeDir: 'right' | 'left') => {
    if (isPaused) return;

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
    if (gameState === 'PLAYING' && timeLeft > 0 && !isPaused) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      setGameState('FINISHED');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, isPaused]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-between bg-slate-50 font-sans overflow-hidden select-none relative pt-safe pb-safe antialiased">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        
        {/* START SCREEN */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center w-full max-w-sm px-6 text-center space-y-12 z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase shadow-2xl">
                <Sparkles size={14} className="text-blue-400" /> MMC Educations
              </div>
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Swipe<span className="text-blue-600">Sprint</span><span className="text-blue-500 opacity-30 text-5xl font-black">8</span>
              </h1>
            </div>

            <div className="w-full bg-white/60 backdrop-blur-3xl p-8 rounded-[3.5rem] border border-white shadow-2xl space-y-8">
              <div className="flex bg-slate-200/50 p-2 rounded-3xl gap-2 shadow-inner border border-white/50">
                <button onClick={() => setDirection('EN_TO_JP')} className={`flex-1 py-5 rounded-2xl font-black text-sm transition-all ${direction === 'EN_TO_JP' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  英 → 日
                </button>
                <button onClick={() => setDirection('JP_TO_EN')} className={`flex-1 py-5 rounded-2xl font-black text-sm transition-all ${direction === 'JP_TO_EN' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  日 → 英
                </button>
              </div>
              <button onClick={startGame} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl hover:brightness-125 active:scale-95 transition-all flex items-center justify-center gap-4">
                <Play size={32} fill="currentColor" /> START
              </button>
            </div>
          </motion.div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md h-[100dvh] flex flex-col items-center justify-between z-10 overflow-hidden">
            
            {/* Header */}
            <div className="w-full flex justify-between items-center bg-white/90 backdrop-blur-md px-6 py-4 rounded-b-[2rem] shadow-md border-b border-white z-30">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 font-black text-3xl tabular-nums ${isPaused ? 'text-slate-300' : 'text-slate-900'}`}>
                  <Timer className={isPaused ? 'text-slate-300' : 'text-blue-600'} size={28} strokeWidth={3} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`p-2.5 rounded-2xl transition-colors ${isPaused ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                </button>
              </div>
              <div className="text-slate-300 font-black text-xl uppercase tracking-tighter">
                #{results.length + 1}
              </div>
            </div>

            {/* Main Dynamic Card (全画面化) */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-visible px-2 py-4">
              <motion.div
                drag={isPaused ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, y, rotate, opacity, scale }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 200) handleSwipe('right');
                  else if (info.offset.x < -200) handleSwipe('left');
                }}
                whileGrab={isPaused ? {} : { cursor: 'grabbing' }}
                className="relative z-20 w-full h-[85vh] bg-white rounded-t-[3rem] rounded-b-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center p-8 touch-none overflow-hidden"
              >
                {/* CHOICE OVERLAYS - 青色ベース */}
                <motion.div style={{ opacity: leftOverlayOpacity }} className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center p-8 z-30 pointer-events-none border-4 border-blue-400">
                  <ChevronLeft size={100} className="text-white/40 mb-4" strokeWidth={8} />
                  <span className="text-white text-5xl md:text-6xl font-black text-center leading-none tracking-tighter whitespace-nowrap drop-shadow-2xl">{quizOptions.left}</span>
                </motion.div>

                <motion.div style={{ opacity: rightOverlayOpacity }} className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center p-8 z-30 pointer-events-none border-4 border-blue-400">
                  <ChevronRight size={100} className="text-white/40 mb-4" strokeWidth={8} />
                  <span className="text-white text-5xl md:text-6xl font-black text-center leading-none tracking-tighter whitespace-nowrap drop-shadow-2xl">{quizOptions.right}</span>
                </motion.div>

                {/* QUESTION WORD - CENTERED & SMALLER & NO-WRAP */}
                <div className="text-center w-full px-2 overflow-hidden flex items-center justify-center">
                  <h2 className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.2] tracking-tighter whitespace-nowrap">
                    {direction === 'EN_TO_JP' 
                      ? shuffledQueue[currentIndex % shuffledQueue.length]?.english 
                      : shuffledQueue[currentIndex % shuffledQueue.length]?.japanese}
                  </h2>
                </div>

                {/* VISUAL GUIDE HINT */}
                <div className="absolute bottom-12 flex flex-col items-center gap-6 opacity-40 w-full px-8">
                   <div className="flex justify-between w-full text-slate-900 font-black text-sm uppercase tracking-widest">
                     <span className="flex items-center gap-1 font-black whitespace-nowrap">{quizOptions.left}</span>
                     <span className="flex items-center gap-1 font-black whitespace-nowrap">{quizOptions.right}</span>
                   </div>
                   <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        animate={isPaused ? {} : { x: [-50, 50] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="w-12 h-full bg-blue-500/50"
                      />
                   </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* FINISHED SCREEN */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl min-h-[100dvh] p-6 flex flex-col items-center justify-between z-10 py-10 overflow-y-auto">
            <div className="text-center space-y-4 py-6">
              <Trophy size={96} className="mx-auto text-orange-400 drop-shadow-2xl animate-bounce" />
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Great Work!</h2>
              <p className="text-slate-500 font-bold text-xl uppercase tracking-widest">Training Summary</p>
            </div>

            <div className="w-full bg-white rounded-[4rem] shadow-2xl overflow-hidden p-3 md:p-6 mb-8 flex-1 border border-slate-100">
              <div className="max-h-[52vh] overflow-y-auto space-y-4 custom-scrollbar px-2 py-4">
                {results.map((item, i) => (
                  <div key={i} className="flex flex-col items-center bg-slate-50 p-7 rounded-[3rem] border border-slate-200 gap-6 transition-all shadow-sm">
                    <div className="flex items-center gap-6 w-full">
                      {item.isCorrect 
                        ? <div className="p-4 bg-emerald-100 rounded-3xl text-emerald-600 shadow-sm"><CheckCircle2 size={40} strokeWidth={5} /></div> 
                        : <div className="p-4 bg-rose-100 rounded-3xl text-rose-500 shadow-sm"><XCircle size={40} strokeWidth={5} /></div>
                      }
                      <div className="flex-1 overflow-hidden">
                        <div className="text-3xl md:text-4xl font-black text-slate-900 leading-none mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{item.word.english}</div>
                        <div className="text-lg md:text-xl text-slate-500 font-black tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 w-full shadow-inner">
                      <button onClick={() => toggleMastery(i, 'remembered')} className={`flex-1 flex items-center justify-center gap-3 px-5 py-5 rounded-[1.5rem] font-black text-sm transition-all ${item.userMastery === 'remembered' ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-slate-300'}`}>
                        <BrainCircuit size={24} /> 覚えた
                      </button>
                      <button onClick={() => toggleMastery(i, 'unsure')} className={`flex-1 flex items-center justify-center gap-3 px-5 py-5 rounded-[1.5rem] font-black text-sm transition-all ${item.userMastery === 'unsure' ? 'bg-rose-500 text-white shadow-xl scale-105' : 'text-slate-300'}`}>
                        <HelpCircle size={24} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-9 bg-slate-900 text-white rounded-[3rem] font-black text-3xl shadow-2xl hover:bg-black transition-all active:scale-95 mt-4">
              <RotateCcw size={36} /> RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f8fafc; margin: 0; padding: 0; }
        * { touch-action: manipulation; }
        .perspective-1000 { perspective: 2500px; }
      `}</style>
    </div>
  );
}
