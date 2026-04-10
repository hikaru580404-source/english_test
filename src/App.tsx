/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Trophy, 
  Timer, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Play,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

// 仮の単語データ（constants.tsがない場合を想定して内部に定義）
const WORDS = [
  { id: 1, english: 'Experience', japanese: '経験', partOfSpeech: 'Noun' },
  { id: 2, english: 'Believe', japanese: '信じる', partOfSpeech: 'Verb' },
  { id: 3, english: 'Decision', japanese: '決定', partOfSpeech: 'Noun' },
  { id: 4, english: 'Imagine', japanese: '想像する', partOfSpeech: 'Verb' },
  { id: 5, english: 'Support', japanese: '支持する', partOfSpeech: 'Verb' },
];

type GameState = 'START' | 'PLAYING' | 'FINISHED';
type SwipeDirection = 'left' | 'right' | null;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0); // 覚えた数
  const [failedCount, setFailedCount] = useState(0); // 不安な数
  const [timeLeft, setTimeLeft] = useState(180); // 3分 (180秒)
  const [rememberedWords, setRememberedWords] = useState<any[]>([]);
  const [forgottenWords, setForgottenWords] = useState<any[]>([]);

  // Motion values for swipe
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const startGame = () => {
    setScore(0);
    setFailedCount(0);
    setTimeLeft(180);
    setCurrentIndex(0);
    setRememberedWords([]);
    setForgottenWords([]);
    setGameState('PLAYING');
  };

  const nextWord = (direction: 'right' | 'left') => {
    const word = WORDS[currentIndex % WORDS.length];
    
    // ハプティクス（振動）
    if (window.navigator.vibrate) window.navigator.vibrate(50);

    if (direction === 'right') {
      setScore(s => s + 1);
      setRememberedWords(prev => [...prev, word]);
    } else {
      setFailedCount(f => f + 1);
      setForgottenWords(prev => [...prev, word]);
    }
    
    setCurrentIndex(prev => prev + 1);
  };

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setGameState('FINISHED');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-8"
          >
            <h1 className="text-6xl font-extrabold text-slate-900">
              SwipeSprint <span className="text-blue-500">8</span>
            </h1>
            <p className="text-slate-500 text-xl">左右スワイプで英単語を仕分けよう</p>
            <button
              onClick={startGame}
              className="px-12 py-5 bg-slate-900 text-white rounded-3xl font-bold text-2xl shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 mx-auto"
            >
              <Play size={24} fill="currentColor" /> START (3 MINS)
            </button>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div key="playing" className="w-full max-w-md flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-white">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
                <Timer size={20} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex items-center gap-4 text-slate-700 font-bold">
                <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={18} /> {score}</span>
                <span className="text-rose-500 flex items-center gap-1"><XCircle size={18} /> {failedCount}</span>
              </div>
            </div>

            <div className="relative h-[400px] w-full flex items-center justify-center">
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, rotate, opacity }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) nextWord('right');
                  else if (info.offset.x < -100) nextWord('left');
                }}
                className="absolute w-full h-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center justify-center p-8 cursor-grab active:cursor-grabbing"
              >
                <span className="text-blue-500 font-bold tracking-widest text-sm mb-4 uppercase">
                  {WORDS[currentIndex % WORDS.length].partOfSpeech}
                </span>
                <h2 className="text-5xl font-black text-slate-900 text-center mb-4">
                  {WORDS[currentIndex % WORDS.length].english}
                </h2>
                <p className="text-2xl text-slate-400 font-medium">スワイプして答えを確認</p>
                
                {/* Visual Guides */}
                <div className="absolute bottom-10 w-full px-10 flex justify-between text-xs font-bold tracking-tighter opacity-20">
                  <div className="flex items-center gap-1"><ArrowLeft size={14} /> 不安・わからない</div>
                  <div className="flex items-center gap-1">覚えた <ArrowRight size={14} /></div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg space-y-6"
          >
            <div className="text-center space-y-2">
              <Trophy size={64} className="mx-auto text-orange-400" />
              <h2 className="text-4xl font-bold text-slate-900">Session Results</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                <p className="text-emerald-600 font-bold text-sm uppercase mb-2 text-center">覚えた</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {rememberedWords.map((w, i) => (
                    <div key={i} className="text-sm font-medium text-slate-700 bg-white p-2 rounded-xl text-center">{w.english}</div>
                  ))}
                </div>
              </div>
              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                <p className="text-rose-600 font-bold text-sm uppercase mb-2 text-center">不安</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {forgottenWords.map((w, i) => (
                    <div key={i} className="text-sm font-medium text-slate-700 bg-white p-2 rounded-xl text-center">{w.english}</div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setGameState('START')}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} /> TRY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
