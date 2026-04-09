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
  RotateCcw, 
  Flame,
  CheckCircle2, 
  XCircle,
  Eye
} from 'lucide-react';
import { WORDS, Word } from './constants';

// ハプティックフィードバック（振動）の実行関数
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
  const [timeLeft, setTimeLeft] = useState(180); // 爆速3分スプリント
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 学習履歴
  const [knownWords, setKnownWords] = useState<Word[]>([]);
  const [unknownWords, setUnknownWords] = useState<Word[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // スワイプアニメーション用の設定
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 0, 150], [-25, 0, 25]);
  const opacity = useTransform(x, [-150, -100, 0, 100, 150], [0, 1, 1, 1, 0]);
  const bgRed = useTransform(x, [-100, 0], [1, 0]);
  const bgGreen = useTransform(x, [0, 100], [0, 1]);

  const nextQuestion = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    setCurrentWord(WORDS[randomIndex]);
    setIsFlipped(false);
    x.set(0); // カードの位置を中央に戻す
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
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('FINISHED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLeft]);

  // スワイプ判定ロジック
  const handleSwipeResult = (dir: 'right' | 'left') => {
    if (!currentWord) return;
    
    if (dir === 'right') {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      setKnownWords(prev => [currentWord, ...prev]);
      triggerHaptic('success');
    } else {
      setStreak(0);
      setUnknownWords(prev => [currentWord, ...prev]);
      triggerHaptic('error');
    }

    setTimeout(() => nextQuestion(), 200);
  };

  // 結果画面での入れ替え
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-white overflow-hidden relative">
      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8 z-10 w-full max-w-sm">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">SwipeSprint 8</h1>
            <button 
              onClick={() => setDirection(prev => prev === 'EN_TO_JP' ? 'JP_TO_EN' : 'EN_TO_JP')}
              className="px-6 py-2 bg-slate-50 rounded-full font-bold text-blue-600 flex items-center gap-2 mx-auto border border-slate-100"
            >
              <ArrowRightLeft className="w-4 h-4" /> {direction === 'EN_TO_JP' ? '英 → 日' : '日 → 英'}
            </button>
            <button onClick={startGame} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition-transform">
              3 MIN SPRINT START
            </button>
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">Swipe Right: Known / Left: Unknown</p>
              <p className="text-slate-300 text-[9px] font-bold text-center italic">MMC educations</p>
            </div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && currentWord && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm flex flex-col gap-4 z-10">
            {/* Header */}
            <div className="flex justify-between items-center px-4 font-black">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border rounded-full shadow-sm">
                <Timer className="text-blue-500 w-4 h-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border rounded-full shadow-sm">
                <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500 animate-bounce' : 'text-slate-200'}`} />
                <span>{streak}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border rounded-full shadow-sm">
                <Trophy className="text-amber-500 w-4 h-4" />
                <span>{score}</span>
              </div>
            </div>

            {/* Swipeable Card Area */}
            <div className="relative h-[420px] w-full mt-2">
              <motion.div
                style={{ x, rotate, opacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 80) handleSwipeResult('right');
                  else if (info.offset.x < -80) handleSwipeResult('left');
                }}
                onClick={() => { setIsFlipped(!isFlipped); triggerHaptic('light'); }}
                className="w-full h-full relative cursor-grab active:cursor-grabbing preserve-3d"
              >
                {/* Visual Guides */}
                <motion.div style={{ opacity: bgGreen }} className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl z-0">覚えた！</motion.div>
                <motion.div style={{ opacity: bgRed }} className="absolute inset-0 bg-rose-500 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl z-0">不安...</motion.div>

                {/* Front Side */}
                <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 bg-white rounded-[2.5rem] border-4 border-slate-50 shadow-2xl flex flex-col items-center justify-center p-8 backface-hidden z-10">
                  <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded mb-6 uppercase tracking-widest">{currentWord.partOfSpeech}</span>
                  <h2 className="text-5xl font-black text-slate-900 leading-tight text-center">{direction === 'EN_TO_JP' ? currentWord.english : currentWord.japanese}</h2>
                  <p className="mt-12 text-slate-300 text-[10px] font-bold animate-pulse">TAP TO SEE MEANING</p>
                </motion.div>

                {/* Back Side */}
                <motion.div animate={{ rotateY: isFlipped ? 0 : -180 }} transition={{ duration: 0.4 }} className="absolute inset-0 bg-slate-900 rounded-[2.5rem] flex flex-col items-center justify-center p-8 backface-hidden z-10">
                  <h2 className="text-4xl font-black text-white leading-tight text-center">{direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english}</h2>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full max-w-lg flex flex-col z-10 pt-4 pb-28">
            <div className="bg-white p-6 rounded-3xl shadow-xl mb-4 text-center border border-slate-50 mx-2">
              <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h2 className="text-2xl font-black">Sprint Clear!</h2>
              <p className="text-slate-500 text-sm font-bold">仕分け：既習 {knownWords.length} / 未習 {unknownWords.length}</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 px-4 custom-scrollbar">
              <section>
                <h3 className="flex items-center gap-2 text-rose-500 font-black text-[11px] mb-3 uppercase tracking-wider">
                  <XCircle className="w-4 h-4" /> Unknown (Swipe Right to Master)
                </h3>
                <div className="grid gap-2">
                  {unknownWords.map((w, idx) => (
                    <motion.div layout key={`un-${w.id}-${idx}`} className="bg-rose-50 p-4 rounded-2xl flex justify-between items-center border border-rose-100 shadow-sm"
                      drag="x" dragConstraints={{ left: 0, right: 100 }} onDragEnd={(_, info) => info.offset.x > 50 && moveWord(w, false)}>
                      <div><p className="font-black text-slate-800">{w.english}</p><p className="text-xs text-rose-400 font-bold">{w.japanese}</p></div>
                      <Eye className="w-4 h-4 text-rose-300" />
                    </motion.div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="flex items-center gap-2 text-emerald-500 font-black text-[11px] mb-3 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Mastered (Swipe Left to Review)
                </h3>
                <div className="grid gap-2">
                  {knownWords.map((w, idx) => (
                    <motion.div layout key={`kn-${w.id}-${idx}`} className="bg-emerald-50 p-4 rounded-2xl flex justify-between items-center border border-emerald-100 shadow-sm"
                      drag="x" dragConstraints={{ left: -100, right: 0 }} onDragEnd={(_, info) => info.offset.x < -50 && moveWord(w, true)}>
                      <div><p className="font-black text-slate-800">{w.english}</p><p className="text-xs text-emerald-400 font-bold">{w.japanese}</p></div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto">
              <button onClick={() => setGameState('START')} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-transform">
                <RotateCcw className="w-5 h-5" /> RESTART SPRINT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
