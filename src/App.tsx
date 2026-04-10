/**
 * @license
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
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// --- 中学2年生 重要英単語データセット (50語厳選) ---
const WORDS = [
  { id: 1, english: 'Experience', japanese: '経験', pos: 'Noun' },
  { id: 2, english: 'Believe', japanese: '信じる', pos: 'Verb' },
  { id: 3, english: 'Evaluate', japanese: '評価する', pos: 'Verb' },
  { id: 4, english: 'Implementation', japanese: '実装', pos: 'Noun' },
  { id: 5, english: 'Requirement', japanese: '要件', pos: 'Noun' },
  { id: 6, english: 'Decision', japanese: '決定', pos: 'Noun' },
  { id: 7, english: 'Imagine', japanese: '想像する', pos: 'Verb' },
  { id: 8, english: 'Support', japanese: '支持する', pos: 'Verb' },
  { id: 9, english: 'Evaluate', japanese: '評価する', pos: 'Verb' },
  { id: 10, english: 'Improve', japanese: '改善する', pos: 'Verb' },
  { id: 11, english: 'Mistake', japanese: '間違い', pos: 'Noun' },
  { id: 12, english: 'Success', japanese: '成功', pos: 'Noun' },
  { id: 13, english: 'Environment', japanese: '環境', pos: 'Noun' },
  { id: 14, english: 'Important', japanese: '重要な', pos: 'Adj' },
  { id: 15, english: 'Necessary', japanese: '必要な', pos: 'Adj' },
  { id: 16, english: 'Popular', japanese: '人気のある', pos: 'Adj' },
  { id: 17, english: 'Possible', japanese: '可能な', pos: 'Adj' },
  { id: 18, english: 'Traditional', japanese: '伝統的な', pos: 'Adj' },
  { id: 19, english: 'Adventure', japanese: '冒険', pos: 'Noun' },
  { id: 20, english: 'Discovery', japanese: '発見', pos: 'Noun' },
  { id: 21, english: 'Understand', japanese: '理解する', pos: 'Verb' },
  { id: 22, english: 'Explain', japanese: '説明する', pos: 'Verb' },
  { id: 23, english: 'Protect', japanese: '守る', pos: 'Verb' },
  { id: 24, english: 'Produce', japanese: '生産する', pos: 'Verb' },
  { id: 25, english: 'Communicate', japanese: '伝える', pos: 'Verb' },
  { id: 26, english: 'Difference', japanese: '違い', pos: 'Noun' },
  { id: 27, english: 'Government', japanese: '政府', pos: 'Noun' },
  { id: 28, english: 'Medicine', japanese: '薬', pos: 'Noun' },
  { id: 29, english: 'Opposite', japanese: '反対の', pos: 'Adj' },
  { id: 30, english: 'Reason', japanese: '理由', pos: 'Noun' },
  { id: 31, english: 'Schedule', japanese: '予定', pos: 'Noun' },
  { id: 32, english: 'Volunteer', japanese: 'ボランティア', pos: 'Noun' },
  { id: 33, english: 'Awful', japanese: 'ひどい', pos: 'Adj' },
  { id: 34, english: 'Brave', japanese: '勇敢な', pos: 'Adj' },
  { id: 35, english: 'Comfortable', pos: '快適な' }, // pos data patch
  { id: 36, english: 'Destroy', japanese: '破壊する', pos: 'Verb' },
  { id: 37, english: 'Education', japanese: '教育', pos: 'Noun' },
  { id: 38, english: 'Foreign', japanese: '外国の', pos: 'Adj' },
  { id: 39, english: 'Generous', japanese: '寛大な', pos: 'Adj' },
  { id: 40, english: 'Harvest', japanese: '収穫', pos: 'Noun' },
  { id: 41, english: 'Information', japanese: '情報', pos: 'Noun' },
  { id: 42, english: 'Journey', japanese: '旅', pos: 'Noun' },
  { id: 43, english: 'Knowledge', japanese: '知識', pos: 'Noun' },
  { id: 44, english: 'Language', japanese: '言語', pos: 'Noun' },
  { id: 45, english: 'Memory', japanese: '記憶', pos: 'Noun' },
  { id: 46, english: 'Notice', japanese: '気づく', pos: 'Verb' },
  { id: 47, english: 'Opinion', japanese: '意見', pos: 'Noun' },
  { id: 48, english: 'Patient', japanese: '忍耐強い', pos: 'Adj' },
  { id: 49, english: 'Quality', japanese: '質', pos: 'Noun' },
  { id: 50, english: 'Recognize', japanese: '認識する', pos: 'Verb' },
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

  // --- Physical Motion values ---
  const x = useMotionValue(0);
  // スワイプによる回転：最大35度まで（以前より大きく）
  const rotate = useTransform(x, [-300, 300], [-35, 35]);
  // スワイプによる透明度
  const opacity = useTransform(x, [-300, -250, 0, 250, 300], [0, 1, 1, 1, 0]);
  // 浮遊感：スワイプするほど少し上に浮き上がる
  const y = useTransform(x, (latest) => -Math.abs(latest) * 0.15);

  // 選択肢ラベルのアニメーション
  const leftScale = useTransform(x, [-200, 0], [1.3, 1]);
  const rightScale = useTransform(x, [0, 200], [1, 1.3]);
  const leftColor = useTransform(x, [-200, 0], ['#e11d48', '#94a3b8']); // 濃いローズ
  const rightColor = useTransform(x, [0, 200], ['#94a3b8', '#059669']); // 濃いエメラルド

  const generateOptions = useCallback((correctWord: typeof WORDS[0], mode: DirectionMode) => {
    const correctVal = mode === 'EN_TO_JP' ? correctWord.japanese : correctWord.english;
    const others = WORDS.filter(w => w.id !== correctWord.id);
    const wrongWord = others[Math.floor(Math.random() * others.length)];
    const wrongVal = mode === 'EN_TO_JP' ? wrongWord.japanese : wrongWord.english;
    
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        
        {/* --- START SCREEN --- */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-10 max-w-sm w-full">
            <div className="space-y-4">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
                Swipe<span className="text-blue-600">Sprint</span> 8
              </h1>
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-white flex gap-2">
                <button 
                  onClick={() => setDirection('EN_TO_JP')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${direction === 'EN_TO_JP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  EN → 日
                </button>
                <button 
                  onClick={() => setDirection('JP_TO_EN')}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${direction === 'JP_TO_EN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  日 → EN
                </button>
              </div>
            </div>

            <button onClick={startGame} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group">
              <Play size={32} className="group-hover:fill-current" /> START
            </button>
          </motion.div>
        )}

        {/* --- PLAYING SCREEN --- */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md flex flex-col gap-12">
            <div className="flex justify-between items-end px-4">
              <div className="space-y-1">
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Time Remaining</p>
                <div className="flex items-center gap-2 text-slate-900 font-black text-4xl tabular-nums">
                  <Timer size={32} className="text-blue-600" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Progress</p>
                <div className="text-slate-900 font-black text-4xl">#{results.length + 1}</div>
              </div>
            </div>

            <div className="relative h-[440px] w-full flex items-center justify-center perspective-1000">
              
              {/* Left Label */}
              <motion.div 
                style={{ scale: leftScale, color: leftColor }}
                className="absolute left-[-25%] z-0 flex flex-col items-center"
              >
                <ChevronLeft size={64} strokeWidth={4} />
                <span className="text-3xl font-black vertical-rl tracking-widest">{quizOptions.left}</span>
              </motion.div>

              {/* Right Label */}
              <motion.div 
                style={{ scale: rightScale, color: rightColor }}
                className="absolute right-[-25%] z-0 flex flex-col items-center"
              >
                <ChevronRight size={64} strokeWidth={4} />
                <span className="text-3xl font-black vertical-rl tracking-widest">{quizOptions.right}</span>
              </motion.div>

              {/* Floating Card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, y, rotate, opacity }}
                onDragEnd={(_, info) => {
                  // 反応閾値を160に設定
                  if (info.offset.x > 160) handleSwipe('right');
                  else if (info.offset.x < -160) handleSwipe('left');
                }}
                whileGrab={{ scale: 1.05, cursor: 'grabbing' }}
                className="z-10 w-full h-full bg-white rounded-[4.5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.18)] border border-white flex flex-col items-center justify-center p-12 touch-none"
              >
                <span className="text-blue-600 font-black tracking-[0.3em] text-sm mb-8 uppercase bg-blue-50 px-5 py-2 rounded-full shadow-sm">
                  {shuffledQueue[currentIndex % shuffledQueue.length]?.pos}
                </span>
                <h2 className="text-7xl font-black text-slate-900 text-center leading-none tracking-tighter">
                  {direction === 'EN_TO_JP' 
                    ? shuffledQueue[currentIndex % shuffledQueue.length]?.english 
                    : shuffledQueue[currentIndex % shuffledQueue.length]?.japanese}
                </h2>
                <div className="absolute bottom-16 flex flex-col items-center gap-2">
                   <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ x: [-20, 20] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="w-6 h-full bg-blue-400/30"
                      />
                   </div>
                   <span className="text-slate-300 font-black tracking-[0.2em] text-xs">SWIPE TO CHOOSE</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* --- FINISHED SCREEN --- */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <Trophy size={96} className="mx-auto text-orange-400 animate-pulse" />
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} className="absolute inset-0 border-4 border-dashed border-orange-200 rounded-full scale-150 -z-10" />
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight mt-6">Results & Mastery</h2>
              <p className="text-slate-500 font-bold text-xl">全 {results.length} 問中 {results.filter(r=>r.isCorrect).length} 問正解！</p>
            </div>

            <div className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] border border-white shadow-2xl overflow-hidden p-8">
              <div className="max-h-[40vh] overflow-y-auto space-y-5 pr-4 custom-scrollbar">
                {results.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
                    <div className="flex items-center gap-6">
                      {item.isCorrect 
                        ? <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600"><CheckCircle2 size={36} strokeWidth={3} /></div> 
                        : <div className="p-3 bg-rose-100 rounded-2xl text-rose-500"><XCircle size={36} strokeWidth={3} /></div>
                      }
                      <div>
                        <div className="text-3xl font-black text-slate-900 leading-none mb-2">{item.word.english}</div>
                        <div className="text-lg text-slate-500 font-bold tracking-wide">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    <div className="flex bg-white p-2 rounded-3xl border border-slate-200 shadow-inner">
                      <button
                        onClick={() => toggleMastery(i, 'remembered')}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-base transition-all ${
                          item.userMastery === 'remembered' 
                            ? 'bg-emerald-600 text-white shadow-lg scale-105' 
                            : 'text-slate-300 hover:text-slate-400'
                        }`}
                      >
                        <BrainCircuit size={22} /> 覚えた
                      </button>
                      <button
                        onClick={() => toggleMastery(i, 'unsure')}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-base transition-all ${
                          item.userMastery === 'unsure' 
                            ? 'bg-rose-500 text-white shadow-lg scale-105' 
                            : 'text-slate-300 hover:text-slate-400'
                        }`}
                      >
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
        .perspective-1000 { perspective: 1500px; }
        .vertical-rl { writing-mode: vertical-rl; }
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; border: 3px solid #f1f5f9; }
        body { -webkit-tap-highlight-color: transparent; background-color: #f1f5f9; }
        * { touch-action: manipulation; }
      `}</style>
    </div>
  );
}
