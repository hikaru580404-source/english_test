/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  motion, 
  AnimatePresence,
  useMotionValue,
  useTransform
} from 'framer-motion';
import { 
  Trophy, 
  Timer, 
  ArrowRightLeft, 
  Play, 
  RotateCcw, 
  Flame,
  CheckCircle2, 
  XCircle,
  Eye
} from 'lucide-react';
import { WORDS, Word } from './constants';

const triggerHaptic = (type: 'success' | 'error' | 'light') => {
  if (typeof window !== 'undefined' && window.navigator.vibrate) {
    if (type === 'success') window.navigator.vibrate(15);
    else if (type === 'error') window.navigator.vibrate([30, 30, 30]);
    else window.navigator.vibrate(10);
  }
};

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [direction, setDirection] = useState('EN_TO_JP');
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3分スプリント
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 学習履歴の管理
  const [knownWords, setKnownWords] = useState<Word[]>([]);
  const [unknownWords, setUnknownWords] = useState<Word[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-25, 0, 25]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]);
  const bgRed = useTransform(x, [-100, 0], [1, 0]);
  const bgGreen = useTransform(x, [0, 100], [0, 1]);

  const nextQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    setCurrentWord(WORDS[randomIndex]);
    setIsFlipped(false);
    x.set(0);
  }, [x]);

  const startGame = () => {
    setGameState('PLAYING');
    setTimeLeft(180);
    setScore(0);
    setStreak(0);
    setKnownWords([]);
    setUnknownWords([]);
    nextQuestion();
  };

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => (prev <= 1 ? (setGameState('FINISHED'), 0) : prev - 1));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLeft]);

  const handleSwipeResult = (dir: 'right' | 'left') => {
    if (!currentWord) return;
    
    if (dir === 'right') {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setKnownWords(prev => [...prev, currentWord]);
      triggerHaptic('success');
    } else {
      setStreak(0);
      setUnknownWords(prev => [...prev, currentWord]);
      triggerHaptic('error');
    }

    setTimeout(() => nextQuestion(), 200);
  };

  // リスト内での仕分け直し用
  const moveWord = (word: Word, fromKnown: boolean) => {
    if (fromKnown) {
      setKnownWords(prev => prev.filter(w => w.id !== word.id));
      setUnknownWords(prev => [word, ...prev]);
    } else {
      setUnknownWords(prev => prev.filter(w => w.id !== word.id));
      setKnownWords(prev => [word, ...prev]);
    }
    triggerHaptic('light');
  };

  return (
    <div className={`h-screen w-full flex items-center justify-center p-4 bg-white overflow-hidden relative`}>
      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 z-10">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">SwipeSprint 8</h1>
            <button onClick={() => setDirection(prev => prev === 'EN_TO_JP' ? 'JP_TO_EN' : 'EN_TO_JP')} className="px-6 py-2 bg-slate-50 rounded-full font-bold text-blue-600 flex items-center gap-2 mx-auto border border-slate-100">
              <ArrowRightLeft className="w-4 h-4" /> {direction === 'EN_TO_JP' ? '英 → 日' : '日 → 英'}
            </button>
            <button onClick={startGame} className="w-full py-5 px-12 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-2xl">3 MIN SPRINT START</button>
            <p className="text-slate-400 text-[10px] font-bold uppercase">Right: Known / Left: Unknown</p>
          </motion.div>
        )}

        {gameState === 'PLAYING' && currentWord && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm flex flex-col gap-4 z-10">
            <div className="flex justify-between items-center px-4 font-black">
              <div className="flex items-center gap-1.5"><Timer className="text-blue-500 w-4 h-4" />{timeLeft}s</div>
              <div className="flex items-center gap-1.5"><Flame className="text-orange-500 w-4 h-4" />{streak}</div>
              <div className="flex items-center gap-1.5"><Trophy className="text-amber-500 w-4 h-4" />{score}</div>
            </div>

            <div className="relative h-[400px] w-full mt-4">
              <motion.div style={{ x, rotate, opacity }} drag="x" dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 80) handleSwipeResult('right');
                  else if (info.offset.x < -80) handleSwipeResult('left');
                }}
                onClick={() => { setIsFlipped(!isFlipped); triggerHaptic('light'); }}
                className="w-full h-full relative cursor-grab active:cursor-grabbing preserve-3d"
              >
                <motion.div style={{ opacity: bgGreen }} className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl">覚えた！</motion.div>
                <motion.div style={{ opacity: bgRed }} className="absolute inset-0 bg-rose-500 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl">不安...</motion.div>

                <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} className="absolute inset-0 bg-white rounded-[2.5rem] border-4 border-slate-50 shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden z-10">
                  <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded mb-4">{currentWord.partOfSpeech}</span>
                  <h2 className="text-4xl font-black text-slate-900">{direction === 'EN_TO_JP' ? currentWord.english : currentWord.japanese}</h2>
                  <p className="mt-10 text-slate-300 text-[10px] font-bold">TAP TO SEE MEANING</p>
                </motion.div>

                <motion.div animate={{ rotateY: isFlipped ? 0 : -180 }} className="absolute inset-0 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center p-8 backface-hidden z-10">
                  <h2 className="text-4xl font-black text-white">{direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english}</h2>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full max-w-lg flex flex-col z-10 pt-4 pb-20">
            <div className="bg-white p-6 rounded-3xl shadow-xl mb-4 text-center">
              <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h2 className="text-2xl font-black">Session Over!</h2>
              <p className="text-slate-500 text-sm">覚えた単語: {knownWords.length} / 未習得: {unknownWords.length}</p>
            </div>

            {/* 復習・仕分けリストエリア */}
            <div className="flex-1 overflow-y-auto space-y-6 px-2 custom-scrollbar">
              <section>
                <h3 className="flex items-center gap-2 text-rose-500 font-black text-sm mb-3"><XCircle className="w-4 h-4" /> 不安な単語（右スワイプで覚えたに移動）</h3>
                <div className="grid gap-2">
                  {unknownWords.map(w => (
                    <motion.div layout key={w.id} className="bg-rose-50 p-4 rounded-2xl flex justify-between items-center border border-rose-100 shadow-sm"
                      drag="x" dragConstraints={{ left: 0, right: 100 }} onDragEnd={(_, info) => info.offset.x > 50 && moveWord(w, false)}>
                      <div><p className="font-black text-slate-800">{w.english}</p><p className="text-xs text-rose-400 font-bold">{w.japanese}</p></div>
                      <Eye className="w-4 h-4 text-rose-300" />
                    </motion.div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-emerald-500 font-black text-sm mb-3"><CheckCircle2 className="w-4 h-4" /> 覚えた単語（左スワイプで不安に移動）</h3>
                <div className="grid gap-2">
                  {knownWords.map(w => (
                    <motion.div layout key={w.id} className="bg-emerald-50 p-4 rounded-2xl flex justify-between items-center border border-emerald-100 shadow-sm"
                      drag="x" dragConstraints={{ left: -100, right: 0 }} onDragEnd={(_, info) => info.offset.x < -50 && moveWord(w, true)}>
                      <div><p className="font-black text-slate-800">{w.english}</p><p className="text-xs text-emerald-400 font-bold">{w.japanese}</p></div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto">
              <button onClick={() => setGameState('START')} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 shadow-2xl">
                <RotateCcw className="w-5 h-5" /> RESTART SPRINT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
