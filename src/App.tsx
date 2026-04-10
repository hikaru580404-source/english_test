/**
 * @license
 * SwipeSprint 8 - Professional Learning Edition (Shuffle Patch)
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
  ChevronLeft
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

  // Motion Values
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-45, 45]);
  const opacity = useTransform(x, [-300, -250, 0, 250, 300], [0, 1, 1, 1, 0]);
  const y = useTransform(x, (latest) => -Math.abs(latest) * 0.25); // 浮遊感：さらに浮くように調整

  // Overlay Opacity (カード上の正解・不正解ガイド)
  const leftGuideOpacity = useTransform(x, [-180, -60], [1, 0]);
  const rightGuideOpacity = useTransform(x, [60, 180], [0, 1]);

  const generateOptions = useCallback((correctWord: typeof WORDS[0], mode: DirectionMode) => {
    const correctVal = mode === 'EN_TO_JP' ? correctWord.japanese : correctWord.english;
    const others = WORDS.filter(w => w.id !== correctWord.id);
    const wrongWord = others[Math.floor(Math.random() * others.length)];
    const wrongVal = mode === 'EN_TO_JP' ? wrongWord.japanese : wrongWord.english;
    
    // 正解を右にするか左にするか完全にランダム化
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

    if (window.navigator.vibrate) window.navigator.vibrate(50);

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
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-slate-50 font-sans overflow-hidden select-none relative pt-safe pb-safe">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-80 h-80 bg-blue-200/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-96 h-96 bg-pink-200/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      <AnimatePresence mode="wait">
        
        {/* START SCREEN */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[90vh] p-6 text-center space-y-12 z-10 w-full max-w-sm">
            <div className="space-y-4">
              <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="inline-block px-5 py-2 bg-slate-900 text-white rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                MMC Educations
              </motion.div>
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Swipe<span className="text-blue-600">Sprint</span><span className="text-blue-400">8</span>
              </h1>
              <p className="text-slate-500 font-bold text-xl px-4">シャッフル対応・英単語50問</p>
            </div>

            <div className="w-full bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] border border-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] space-y-8">
              <div className="flex bg-slate-100 p-2 rounded-2xl gap-2 shadow-inner border border-slate-200">
                <button onClick={() => setDirection('EN_TO_JP')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${direction === 'EN_TO_JP' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                  英 → 日
                </button>
                <button onClick={() => setDirection('JP_TO_EN')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${direction === 'JP_TO_EN' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>
                  日 → 英
                </button>
              </div>
              <button onClick={startGame} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4">
                <Play size={28} fill="currentColor" /> START
              </button>
            </div>
          </motion.div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md h-screen flex flex-col gap-6 p-4 z-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white/90 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] shadow-sm border border-white mt-4">
              <div className="flex items-center gap-3 text-slate-900 font-black text-3xl tabular-nums">
                <Timer className="text-blue-600" size={32} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="px-5 py-1.5 bg-slate-900 rounded-full text-white font-black text-sm uppercase shadow-md">
                Q.{results.length + 1}
              </div>
            </div>

            {/* Floating Card UI */}
            <div className="relative flex-1 min-h-[400px] w-full flex items-center justify-center">
              
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, y, rotate, opacity }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 160) handleSwipe('right');
                  else if (info.offset.x < -160) handleSwipe('left');
                }}
                whileGrab={{ scale: 1.05 }}
                className="relative z-20 w-full aspect-[3/4] max-h-[550px] bg-white rounded-[4.5rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.25)] border border-white flex flex-col items-center justify-center p-12 touch-none cursor-grab active:cursor-grabbing"
              >
                {/* Dynamic Choice Overlays */}
                <motion.div style={{ opacity: leftGuideOpacity }} className="absolute inset-0 bg-rose-600 rounded-[4.5rem] flex flex-col items-center justify-center p-10 z-30 pointer-events-none">
                  <ChevronLeft size={100} className="text-white mb-6" strokeWidth={5} />
                  <span className="text-white text-5xl font-black text-center leading-tight tracking-tighter drop-shadow-lg">{quizOptions.left}</span>
                </motion.div>

                <motion.div style={{ opacity: rightGuideOpacity }} className="absolute inset-0 bg-emerald-600 rounded-[4.5rem] flex flex-col items-center justify-center p-10 z-30 pointer-events-none">
                  <ChevronRight size={100} className="text-white mb-6" strokeWidth={5} />
                  <span className="text-white text-5xl font-black text-center leading-tight tracking-tighter drop-shadow-lg">{quizOptions.right}</span>
                </motion.div>

                {/* Question Info */}
                <div className="text-center space-y-8">
                  <span className="text-blue-600 font-black tracking-[0.4em] text-sm uppercase bg-blue-50 px-6 py-2.5 rounded-full border border-blue-100">
                    {shuffledQueue[currentIndex % shuffledQueue.length]?.pos}
                  </span>
                  <h2 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1] tracking-tighter">
                    {direction === 'EN_TO_JP' 
                      ? shuffledQueue[currentIndex % shuffledQueue.length]?.english 
                      : shuffledQueue[currentIndex % shuffledQueue.length]?.japanese}
                  </h2>
                </div>

                <div className="absolute bottom-16 flex flex-col items-center gap-4 opacity-50 w-full px-12">
                  <div className="flex justify-between w-full text-slate-900 font-black text-lg">
                    <span className="flex items-center gap-1"><ChevronLeft size={20}/> {quizOptions.left}</span>
                    <span className="flex items-center gap-1">{quizOptions.right} <ChevronRight size={20}/></span>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div animate={{ x: [-40, 40] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="w-12 h-full bg-blue-500/40" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* FINISHED SCREEN */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl p-6 flex flex-col gap-6 z-10 pb-16">
            <div className="text-center space-y-3 py-6">
              <div className="relative inline-block">
                <Trophy size={80} className="mx-auto text-orange-400 drop-shadow-xl animate-bounce" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Mission Clear!</h2>
              <p className="text-slate-500 font-bold text-xl">学習内容を仕分けましょう</p>
            </div>

            <div className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] border border-white shadow-2xl overflow-hidden p-4">
              <div className="max-h-[55vh] overflow-y-auto space-y-4 custom-scrollbar px-2 py-4">
                {results.map((item, i) => (
                  <div key={i} className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-7 rounded-[2.5rem] border border-slate-200 shadow-sm gap-5 transition-all hover:border-blue-200">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      {item.isCorrect 
                        ? <div className="p-3.5 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm"><CheckCircle2 size={36} strokeWidth={4} /></div> 
                        : <div className="p-3.5 bg-rose-100 rounded-2xl text-rose-500 shadow-sm"><XCircle size={36} strokeWidth={4} /></div>
                      }
                      <div>
                        <div className="text-3xl font-black text-slate-900 leading-none mb-2">{item.word.english}</div>
                        <div className="text-lg text-slate-500 font-black tracking-wide uppercase">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    <div className="flex bg-white p-2 rounded-3xl border border-slate-200 w-full md:w-auto shadow-inner">
                      <button onClick={() => toggleMastery(i, 'remembered')} className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all ${item.userMastery === 'remembered' ? 'bg-emerald-600 text-white shadow-lg scale-[1.03]' : 'text-slate-300 hover:text-slate-400'}`}>
                        <BrainCircuit size={22} /> 覚えた
                      </button>
                      <button onClick={() => toggleMastery(i, 'unsure')} className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-sm transition-all ${item.userMastery === 'unsure' ? 'bg-rose-500 text-white shadow-lg scale-[1.03]' : 'text-slate-300 hover:text-slate-400'}`}>
                        <HelpCircle size={22} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 shadow-2xl hover:bg-black transition-all active:scale-95">
              <RotateCcw size={32} /> SAVE & RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid #f8fafc; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f8fafc; }
        * { touch-action: manipulation; }
        .pt-safe { padding-top: env(safe-area-inset-top, 16px); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
      `}</style>
    </div>
  );
}
