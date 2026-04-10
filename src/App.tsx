/**
 * @license
 * SwipeSprint 8 - Fluid Interactive Edition
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

// --- 中学2年生 厳選単語データセット (物理演算テスト用) ---
const WORDS = [
  { id: 1, english: 'Experience', japanese: '経験', pos: 'Noun' },
  { id: 2, english: 'Believe', japanese: '信じる', pos: 'Verb' },
  { id: 3, english: 'Improve', japanese: '改善する', pos: 'Verb' },
  { id: 4, english: 'Important', japanese: '重要な', pos: 'Adj' },
  { id: 5, english: 'Knowledge', japanese: '知識', pos: 'Noun' },
  { id: 6, english: 'Destroy', japanese: '破壊する', pos: 'Verb' },
  { id: 7, english: 'Brave', japanese: '勇敢な', pos: 'Adj' },
  { id: 8, english: 'Foreign', japanese: '外国の', pos: 'Adj' },
  { id: 9, english: 'Understand', japanese: '理解する', pos: 'Verb' },
  { id: 10, english: 'Memory', japanese: '記憶', pos: 'Noun' },
  { id: 11, english: 'Explain', japanese: '説明する', pos: 'Verb' },
  { id: 12, english: 'Discovery', japanese: '発見', pos: 'Noun' },
  { id: 13, english: 'Important', japanese: '重要な', pos: 'Adj' },
  { id: 14, english: 'Condition', japanese: '状態', pos: 'Noun' },
  { id: 15, english: 'Traditional', japanese: '伝統的な', pos: 'Adj' },
].map(w => ({ ...w, pos: w.pos || 'Word' }));

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

  // --- 物理演算 Motion Values ---
  const x = useMotionValue(0);
  // スワイプ量に応じた回転角（最大50度：浮遊感を高める）
  const rotate = useTransform(x, [-250, 250], [-50, 50]);
  // スワイプ量に応じた透明度
  const opacity = useTransform(x, [-300, -200, 0, 200, 300], [0, 1, 1, 1, 0]);
  // スワイプ量に応じてカードを浮かせる（Y軸の浮力：0.35倍で大きく浮遊）
  const y = useTransform(x, (latest) => -Math.abs(latest) * 0.35);
  // カードのスケール（中央は1.0、端に行くと少し拡大して強調）
  const scale = useTransform(x, [-200, 0, 200], [1.08, 1, 1.08]);

  // オーバーレイ（ガイド）の透明度
  const leftOverlayOpacity = useTransform(x, [-200, -80], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [80, 200], [0, 1]);

  const generateOptions = useCallback((correctWord: typeof WORDS[0], mode: DirectionMode) => {
    const correctVal = mode === 'EN_TO_JP' ? correctWord.japanese : correctWord.english;
    const others = WORDS.filter(w => w.id !== correctWord.id);
    const wrongVal = mode === 'EN_TO_JP' 
      ? others[Math.floor(Math.random() * others.length)].japanese 
      : others[Math.floor(Math.random() * others.length)].english;
    
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
    x.set(0); // 次のカードのために位置リセット
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans overflow-hidden select-none relative pb-safe">
      
      {/* Visual Ambiance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-pink-100/50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- START --- */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative z-10 w-full max-w-sm px-6 text-center space-y-12">
            <div className="space-y-4">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-tighter uppercase shadow-xl">
                <Sparkles size={14} className="text-yellow-400" /> MMC Educations
              </motion.div>
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter leading-none">
                Swipe<span className="text-blue-600">Sprint</span><span className="text-blue-500 opacity-50 text-5xl">8</span>
              </h1>
              <p className="text-slate-400 font-bold text-lg">物理演算スワイプで覚える</p>
            </div>

            <div className="bg-white/60 backdrop-blur-3xl p-8 rounded-[3rem] border border-white shadow-2xl space-y-8">
              <div className="flex bg-slate-200/50 p-2 rounded-2xl gap-2 shadow-inner">
                <button onClick={() => setDirection('EN_TO_JP')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${direction === 'EN_TO_JP' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  EN → 日
                </button>
                <button onClick={() => setDirection('JP_TO_EN')} className={`flex-1 py-4 rounded-xl font-black text-sm transition-all ${direction === 'JP_TO_EN' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                  日 → EN
                </button>
              </div>
              <button onClick={startGame} className="w-full py-8 bg-slate-900 text-white rounded-3xl font-black text-3xl shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                <Play size={32} fill="currentColor" /> START
              </button>
            </div>
          </motion.div>
        )}

        {/* --- PLAYING --- */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md h-full flex flex-col gap-6 p-4 z-10">
            {/* Fluid Header */}
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] shadow-xl border border-white/50 mt-4">
              <div className="flex items-center gap-3 text-slate-900 font-black text-3xl tabular-nums">
                <Timer className="text-blue-600" size={32} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="px-5 py-2 bg-blue-50 text-blue-600 rounded-2xl font-black text-sm uppercase">
                #{results.length + 1}
              </div>
            </div>

            {/* Floating Card Stack */}
            <div className="relative flex-1 min-h-[450px] w-full flex items-center justify-center perspective-1000">
              
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, y, rotate, opacity, scale }}
                onDragEnd={(_, info) => {
                  // しきい値を180に増やし、浮遊感を最大限に活かす
                  if (info.offset.x > 180) handleSwipe('right');
                  else if (info.offset.x < -180) handleSwipe('left');
                }}
                whileGrab={{ cursor: 'grabbing' }}
                className="relative z-20 w-[90%] aspect-[3/4.2] bg-white rounded-[4.5rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,0.3)] border border-white flex flex-col items-center justify-center p-12 touch-none"
              >
                {/* CHOICE OVERLAYS - 極太・濃い文字 */}
                <motion.div style={{ opacity: leftOverlayOpacity }} className="absolute inset-0 bg-rose-600/95 rounded-[4.5rem] flex flex-col items-center justify-center p-10 z-30 pointer-events-none">
                  <ChevronLeft size={120} className="text-white mb-6" strokeWidth={6} />
                  <span className="text-white text-6xl font-black text-center leading-none tracking-tighter drop-shadow-2xl">{quizOptions.left}</span>
                </motion.div>

                <motion.div style={{ opacity: rightOverlayOpacity }} className="absolute inset-0 bg-emerald-600/95 rounded-[4.5rem] flex flex-col items-center justify-center p-10 z-30 pointer-events-none">
                  <ChevronRight size={120} className="text-white mb-6" strokeWidth={6} />
                  <span className="text-white text-6xl font-black text-center leading-none tracking-tighter drop-shadow-2xl">{quizOptions.right}</span>
                </motion.div>

                {/* WORD INFO */}
                <div className="text-center space-y-8">
                  <span className="text-blue-600/50 font-black tracking-[0.5em] text-xs uppercase bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
                    {shuffledQueue[currentIndex % shuffledQueue.length]?.pos}
                  </span>
                  <h2 className="text-6xl md:text-8xl font-black text-slate-900 leading-[1] tracking-tighter">
                    {direction === 'EN_TO_JP' 
                      ? shuffledQueue[currentIndex % shuffledQueue.length]?.english 
                      : shuffledQueue[currentIndex % shuffledQueue.length]?.japanese}
                  </h2>
                </div>

                {/* GUIDE BAR */}
                <div className="absolute bottom-16 flex flex-col items-center gap-4 opacity-30 w-full px-12">
                   <div className="flex justify-between w-full text-slate-900 font-black text-sm uppercase tracking-widest">
                     <span>{quizOptions.left}</span>
                     <span>{quizOptions.right}</span>
                   </div>
                   <div className="w-24 h-1.5 bg-slate-100 rounded-full" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* --- FINISHED --- */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl p-6 flex flex-col gap-6 z-10">
            <div className="text-center space-y-4 py-8">
              <Trophy size={96} className="mx-auto text-orange-400 drop-shadow-2xl animate-bounce" />
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter">Session Clear</h2>
              <p className="text-slate-500 font-bold text-xl uppercase tracking-widest">Mastery Sorting</p>
            </div>

            <div className="bg-white/90 backdrop-blur-3xl rounded-[4rem] border border-white shadow-2xl overflow-hidden p-4">
              <div className="max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar px-2 py-6">
                {results.map((item, i) => (
                  <div key={i} className="flex flex-col md:flex-row items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm gap-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                      {item.isCorrect 
                        ? <div className="p-4 bg-emerald-100 rounded-3xl text-emerald-600 shadow-sm"><CheckCircle2 size={40} strokeWidth={4} /></div> 
                        : <div className="p-4 bg-rose-100 rounded-3xl text-rose-500 shadow-sm"><XCircle size={40} strokeWidth={4} /></div>
                      }
                      <div>
                        <div className="text-3xl font-black text-slate-900 leading-none mb-2">{item.word.english}</div>
                        <div className="text-lg text-slate-500 font-black tracking-wide uppercase">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    {/* Mastery Toggles - 極太 */}
                    <div className="flex bg-slate-100 p-2 rounded-3xl border border-slate-200 w-full md:w-auto shadow-inner">
                      <button onClick={() => toggleMastery(i, 'remembered')} className={`flex-1 flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-black text-sm transition-all ${item.userMastery === 'remembered' ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-slate-300 hover:text-slate-400'}`}>
                        <BrainCircuit size={24} /> 覚えた
                      </button>
                      <button onClick={() => toggleMastery(i, 'unsure')} className={`flex-1 flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-black text-sm transition-all ${item.userMastery === 'unsure' ? 'bg-rose-500 text-white shadow-xl scale-105' : 'text-slate-300 hover:text-slate-400'}`}>
                        <HelpCircle size={24} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl hover:bg-black transition-all active:scale-95 mt-4">
              <RotateCcw size={32} /> RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 4px solid #f8fafc; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f8fafc; }
        * { touch-action: manipulation; }
        .perspective-1000 { perspective: 2000px; }
      `}</style>
    </div>
  );
}
