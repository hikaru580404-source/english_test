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
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// --- テスト用データセット ---
const WORDS = [
  { id: 1, english: 'Evaluate', japanese: '評価する', partOfSpeech: 'Verb' },
  { id: 2, english: 'Implementation', japanese: '実装', partOfSpeech: 'Noun' },
  { id: 3, english: 'Requirement', japanese: '要件', partOfSpeech: 'Noun' },
  { id: 4, english: 'Procedure', japanese: '手順', partOfSpeech: 'Noun' },
  { id: 5, english: 'Legal', japanese: '法的な', partOfSpeech: 'Adj' },
];

type GameState = 'START' | 'PLAYING' | 'FINISHED';
interface QuizResult {
  word: typeof WORDS[0];
  isCorrect: boolean;
  userMastery: 'remembered' | 'unsure';
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizOptions, setQuizOptions] = useState<{left: string, right: string}>({left: '', right: ''});

  // Motion Values for Swipe logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  // 選択肢の文字サイズや色の変化（ドラッグ中）
  const leftScale = useTransform(x, [-150, 0], [1.2, 1]);
  const rightScale = useTransform(x, [0, 150], [1, 1.2]);
  const leftOpacity = useTransform(x, [-150, 0], [1, 0.3]);
  const rightOpacity = useTransform(x, [0, 150], [0.3, 1]);

  // オプションの生成（左右をランダムに入れ替え）
  const generateOptions = useCallback((correctWord: typeof WORDS[0]) => {
    const otherWords = WORDS.filter(w => w.id !== correctWord.id);
    const wrongWord = otherWords[Math.floor(Math.random() * otherWords.length)];
    
    return Math.random() > 0.5 
      ? { right: correctWord.japanese, left: wrongWord.japanese } 
      : { right: wrongWord.japanese, left: correctWord.japanese };
  }, []);

  const startGame = () => {
    setResults([]);
    setCurrentIndex(0);
    setTimeLeft(180);
    setQuizOptions(generateOptions(WORDS[0]));
    setGameState('PLAYING');
  };

  const handleSwipe = (direction: 'right' | 'left') => {
    const currentWord = WORDS[currentIndex % WORDS.length];
    const selectedAnswer = direction === 'right' ? quizOptions.right : quizOptions.left;
    const isCorrect = selectedAnswer === currentWord.japanese;

    // ハプティクス（iPhone等で動作）
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    // 結果を記録
    setResults(prev => [...prev, { word: currentWord, isCorrect, userMastery: 'unsure' }]);

    // 次へ
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setQuizOptions(generateOptions(WORDS[nextIdx % WORDS.length]));
    x.set(0); // 位置リセット
  };

  // 終了後の仕分けトグル
  const toggleMastery = (index: number, status: 'remembered' | 'unsure') => {
    setResults(prev => prev.map((item, i) => 
      i === index ? { ...item, userMastery: status } : item
    ));
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        
        {/* START SCREEN */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8">
            <div className="space-y-2">
              <h1 className="text-7xl font-black text-slate-900 tracking-tighter">SwipeSprint <span className="text-blue-500">8</span></h1>
              <p className="text-slate-400 text-xl font-bold uppercase tracking-widest text-center">MMCE Test Edition</p>
            </div>
            <button onClick={startGame} className="px-16 py-7 bg-slate-900 text-white rounded-[2.5rem] font-bold text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto group">
              <Play className="group-hover:fill-current" /> START TEST
            </button>
          </motion.div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md flex flex-col gap-10">
            {/* Header Info */}
            <div className="flex justify-between items-center bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-white">
              <div className="flex items-center gap-3 text-blue-600 font-bold text-3xl tabular-nums">
                <Timer size={28} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-slate-300 font-black text-2xl">#{results.length + 1}</div>
            </div>

            {/* Swipe Area */}
            <div className="relative h-[420px] w-full flex items-center justify-center">
              
              {/* Left Option Label */}
              <motion.div 
                style={{ scale: leftScale, opacity: leftOpacity }}
                className="absolute left-[-20%] z-0 flex flex-col items-center text-rose-500"
              >
                <ChevronLeft size={48} className="mb-2" />
                <span className="text-2xl font-black vertical-rl">{quizOptions.left}</span>
              </motion.div>

              {/* Right Option Label */}
              <motion.div 
                style={{ scale: rightScale, opacity: rightOpacity }}
                className="absolute right-[-20%] z-0 flex flex-col items-center text-emerald-500"
              >
                <ChevronRight size={48} className="mb-2" />
                <span className="text-2xl font-black vertical-rl">{quizOptions.right}</span>
              </motion.div>

              {/* Main Card */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, rotate, opacity }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 120) handleSwipe('right');
                  else if (info.offset.x < -120) handleSwipe('left');
                }}
                className="z-10 w-full h-full bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-50 flex flex-col items-center justify-center p-12 cursor-grab active:cursor-grabbing touch-none"
              >
                <span className="text-blue-500 font-black tracking-[0.2em] text-xs mb-6 uppercase bg-blue-50 px-4 py-1.5 rounded-full">
                  {WORDS[currentIndex % WORDS.length].partOfSpeech}
                </span>
                <h2 className="text-6xl font-black text-slate-900 text-center leading-none tracking-tight">
                  {WORDS[currentIndex % WORDS.length].english}
                </h2>
                <div className="absolute bottom-12 text-slate-200 font-black tracking-widest text-sm animate-pulse">
                  SWIPE TO SELECT
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* FINISHED SCREEN */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl flex flex-col gap-8">
            <div className="text-center space-y-2">
              <Trophy size={80} className="mx-auto text-orange-400 animate-bounce" />
              <h2 className="text-5xl font-black text-slate-900">Test Complete</h2>
              <p className="text-slate-500 font-bold text-lg">全 {results.length} 問回答しました。仕分けを行いましょう。</p>
            </div>

            {/* Result List */}
            <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white shadow-2xl overflow-hidden p-6">
              <div className="max-h-[45vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {results.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-5">
                      {item.isCorrect ? <CheckCircle2 className="text-emerald-500" size={32} /> : <XCircle className="text-rose-400" size={32} />}
                      <div>
                        <div className="text-2xl font-black text-slate-900 leading-none mb-1">{item.word.english}</div>
                        <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    {/* Manual Mastery Toggle */}
                    <div className="flex bg-slate-50 p-1.5 rounded-3xl border border-slate-100">
                      <button
                        onClick={() => toggleMastery(i, 'remembered')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] font-black text-sm transition-all ${
                          item.userMastery === 'remembered' 
                            ? 'bg-emerald-500 text-white shadow-lg' 
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <BrainCircuit size={18} /> 覚えた
                      </button>
                      <button
                        onClick={() => toggleMastery(i, 'unsure')}
                        className={`flex items-center gap-2 px-5 py-3 rounded-[1.5rem] font-black text-sm transition-all ${
                          item.userMastery === 'unsure' 
                            ? 'bg-rose-400 text-white shadow-lg' 
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <HelpCircle size={18} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95">
              <RotateCcw size={28} /> SAVE & RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .vertical-rl { writing-mode: vertical-rl; }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        body { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
