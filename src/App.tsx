/**
 * @license
 * SwipeSprint 8 - Professional Learning Edition
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Settings2
} from 'lucide-react';

// --- 中学2年生 必須単語データセット ---
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
  const rotate = useTransform(x, [-250, 250], [-40, 40]); // 回転をさらにダイナミックに
  const opacity = useTransform(x, [-250, -200, 0, 200, 250], [0, 1, 1, 1, 0]);
  const y = useTransform(x, (latest) => -Math.abs(latest) * 0.2); // 浮遊感：大きく浮く

  // Overlay Opacity (カード上のガイド表示用)
  const leftGuideOpacity = useTransform(x, [-150, -50], [1, 0]);
  const rightGuideOpacity = useTransform(x, [50, 150], [0, 1]);

  const generateOptions = useCallback((correctWord: typeof WORDS[0], mode: DirectionMode) => {
    const correctVal = mode === 'EN_TO_JP' ? correctWord.japanese : correctWord.english;
    const others = WORDS.filter(w => w.id !== correctWord.id);
    const wrongVal = mode === 'EN_TO_JP' 
      ? others[Math.floor(Math.random() * others.length)].japanese 
      : others[Math.floor(Math.random() * others.length)].english;
    
    return Math.random() > 0.5 
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
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        
        {/* START SCREEN */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center min-h-[90vh] p-6 text-center space-y-12 z-10 w-full max-w-sm">
            <div className="space-y-4">
              <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="inline-block px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                MMC Educations
              </motion.div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Swipe<span className="text-blue-600">Sprint</span> 8
              </h1>
              <p className="text-slate-400 font-bold text-lg px-4">直感スワイプで英単語をマスター</p>
            </div>

            <div className="w-full bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl space-y-6">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button onClick={() => setDirection('EN_TO_JP')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${direction === 'EN_TO_JP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  英 → 日
                </button>
                <button onClick={() => setDirection('JP_TO_EN')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${direction === 'JP_TO_EN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  日 → 英
                </button>
              </div>
              <button onClick={startGame} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-2xl shadow-xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3">
                <Play size={24} fill="currentColor" /> START TEST
              </button>
            </div>
          </motion.div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md h-full flex flex-col gap-6 p-4 z-10">
            {/* Minimal Header */}
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl shadow-sm border border-white sticky top-4">
              <div className="flex items-center gap-2 text-slate-900 font-black text-2xl tabular-nums">
                <Timer className="text-blue-600" size={24} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="px-4 py-1 bg-slate-100 rounded-full text-slate-400 font-black text-sm uppercase">
                Q.{results.length + 1}
              </div>
            </div>

            {/* Floating Card UI */}
            <div className="relative flex-1 min-h-[450px] w-full flex items-center justify-center">
              
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, y, rotate, opacity }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 150) handleSwipe('right');
                  else if (info.offset.x < -150) handleSwipe('left');
                }}
                whileGrab={{ scale: 1.05 }}
                className="relative z-20 w-full aspect-[3/4] max-h-[500px] bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border border-white flex flex-col items-center justify-center p-10 touch-none"
              >
                {/* Overlay Answer Guides (カード内に表示) */}
                <motion.div style={{ opacity: leftGuideOpacity }} className="absolute inset-0 bg-rose-500 rounded-[4rem] flex flex-col items-center justify-center p-8 z-30 pointer-events-none">
                  <ChevronLeft size={80} className="text-white mb-4" strokeWidth={4} />
                  <span className="text-white text-4xl font-black text-center leading-tight">{quizOptions.left}</span>
                </motion.div>

                <motion.div style={{ opacity: rightGuideOpacity }} className="absolute inset-0 bg-emerald-500 rounded-[4rem] flex flex-col items-center justify-center p-8 z-30 pointer-events-none">
                  <ChevronRight size={80} className="text-white mb-4" strokeWidth={4} />
                  <span className="text-white text-4xl font-black text-center leading-tight">{quizOptions.right}</span>
                </motion.div>

                {/* Question Content */}
                <div className="text-center space-y-6">
                  <span className="text-blue-600 font-black tracking-[0.3em] text-sm uppercase bg-blue-50 px-5 py-2 rounded-full">
                    {shuffledQueue[currentIndex % shuffledQueue.length]?.pos}
                  </span>
                  <h2 className="text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                    {direction === 'EN_TO_JP' 
                      ? shuffledQueue[currentIndex % shuffledQueue.length]?.english 
                      : shuffledQueue[currentIndex % shuffledQueue.length]?.japanese}
                  </h2>
                </div>

                <div className="absolute bottom-12 flex flex-col items-center gap-3 opacity-30">
                  <div className="flex gap-16 justify-between w-full text-slate-900 font-black text-sm">
                    <span className="flex items-center"><ChevronLeft size={16}/> {quizOptions.left}</span>
                    <span className="flex items-center">{quizOptions.right} <ChevronRight size={16}/></span>
                  </div>
                  <div className="w-16 h-1 bg-slate-200 rounded-full" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* FINISHED SCREEN */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl p-4 flex flex-col gap-6 z-10 pb-12">
            <div className="text-center space-y-2 py-4">
              <Trophy size={72} className="mx-auto text-orange-400" />
              <h2 className="text-4xl font-black text-slate-900">Training Result</h2>
              <p className="text-slate-500 font-bold">結果を確認し、学習状況を記録しましょう</p>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white shadow-2xl overflow-hidden p-4 md:p-8">
              <div className="max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {results.map((item, i) => (
                  <div key={i} className="flex flex-col md:flex-row items-center justify-between bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 gap-4">
                    <div className="flex items-center gap-5 w-full md:w-auto">
                      {item.isCorrect 
                        ? <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600"><CheckCircle2 size={32} strokeWidth={3} /></div> 
                        : <div className="p-3 bg-rose-100 rounded-2xl text-rose-500"><XCircle size={32} strokeWidth={3} /></div>
                      }
                      <div>
                        <div className="text-2xl font-black text-slate-900 leading-tight">{item.word.english}</div>
                        <div className="text-base text-slate-500 font-black">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    <div className="flex bg-white p-2 rounded-3xl border border-slate-200 w-full md:w-auto shadow-inner">
                      <button onClick={() => toggleMastery(i, 'remembered')} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${item.userMastery === 'remembered' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300'}`}>
                        <BrainCircuit size={20} /> 覚えた
                      </button>
                      <button onClick={() => toggleMastery(i, 'unsure')} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm transition-all ${item.userMastery === 'unsure' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-300'}`}>
                        <HelpCircle size={20} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 shadow-2xl hover:bg-black transition-all active:scale-95 sticky bottom-4">
              <RotateCcw size={32} /> SAVE & RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .vertical-rl { writing-mode: vertical-rl; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f8fafc; }
        * { touch-action: manipulation; }
        .pt-safe { padding-top: env(safe-area-inset-top); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  );
}
