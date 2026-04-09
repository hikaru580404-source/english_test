/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Trophy, 
  Timer, 
  Settings2, 
  ArrowRightLeft, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Keyboard
} from 'lucide-react';
import { WORDS, Word } from './constants';

// --- Utility: Shuffle ---
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [mode, setMode] = useState('EASY');
  const [direction, setDirection] = useState('EN_TO_JP');
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(600);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomWord = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    return WORDS[randomIndex];
  }, []);

  const generateOptions = useCallback((correctWord: Word) => {
    const correctValue = direction === 'EN_TO_JP' ? correctWord.japanese : correctWord.english;
    const otherWords = WORDS.filter(w => w.id !== correctWord.id);
    const shuffledOthers = shuffleArray(otherWords);
    const wrongOptions = shuffledOthers.slice(0, 2).map(w => 
      direction === 'EN_TO_JP' ? w.japanese : w.english
    );
    return shuffleArray([correctValue, ...wrongOptions]);
  }, [direction]);

  const nextQuestion = useCallback(() => {
    const word = getRandomWord();
    setCurrentWord(word);
    setOptions(generateOptions(word));
    setUserInput('');
    setFeedback(null);
    setIsFlipping(false);
  }, [getRandomWord, generateOptions]);

  const startGame = () => {
    setGameState('PLAYING');
    setTimeLeft(600);
    setScore(0);
    setTotalAnswered(0);
    nextQuestion();
  };

  const finishGame = useCallback(() => {
    setGameState('FINISHED');
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, timeLeft, finishGame]);

  const handleAnswer = (answer: string) => {
    if (feedback || !currentWord) return;
    const correctAnswer = direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english;
    const isCorrect = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    
    setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
    setTotalAnswered(prev => prev + 1);
    if (isCorrect) setScore(prev => prev + 1);

    setTimeout(() => {
      setIsFlipping(true);
      setTimeout(() => {
        nextQuestion();
      }, 600);
    }, 800);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full bg-white text-slate-900 font-sans flex items-center justify-center p-3 overflow-hidden relative overflow-y-auto sm:overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[60%] h-[60%] bg-pink-400/10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* スタート画面 */}
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="max-w-md w-full text-center space-y-4 md:space-y-8 z-10"
          >
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900">FlashCard8</h1>
              <p className="text-slate-400 text-sm">Junior High English Mastery</p>
            </div>

            <div className="grid gap-2 md:gap-3">
              <button 
                onClick={() => setDirection(prev => prev === 'EN_TO_JP' ? 'JP_TO_EN' : 'EN_TO_JP')}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-600">学習方向</span>
                </div>
                <span className="text-blue-600 font-bold">{direction === 'EN_TO_JP' ? '英 → 日' : '日 → 英'}</span>
              </button>

              <button 
                onClick={() => setMode(prev => prev === 'EASY' ? 'HARD' : 'EASY')}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-slate-600">モード</span>
                </div>
                <span className="text-purple-600 font-bold">{mode === 'EASY' ? '3択' : '記述'}</span>
              </button>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
            >
              START
            </button>
          </motion.div>
        )}

        {/* プレイ画面 */}
        {gameState === 'PLAYING' && currentWord && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-lg flex flex-col gap-2 md:gap-6 z-10"
          >
            {/* Header: ステータス */}
            <div className="flex justify-between items-center text-xs md:text-sm font-bold">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                <Timer className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-mono text-slate-700">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-700">{score} / {totalAnswered}</span>
              </div>
            </div>

            {/* メインカード: 高さを極限まで圧縮 (160px) */}
            <div className="relative h-[160px] md:h-[280px] w-full perspective-1000">
              <motion.div 
                animate={{ rotateY: isFlipping ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* 表面 */}
                <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border-2 border-slate-50 shadow-xl flex flex-col items-center justify-center p-4">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase mb-2">
                    {currentWord.partOfSpeech}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                    {direction === 'EN_TO_JP' ? currentWord.english : currentWord.japanese}
                  </h2>
                </div>

                {/* 裏面 */}
                <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-3xl flex items-center justify-center p-4 rotate-y-180">
                  <h2 className="text-3xl md:text-5xl font-black text-white">
                    {direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english}
                  </h2>
                </div>
              </motion.div>

              {/* フィードバック表示 */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute top-2 right-2 z-20"
                  >
                    {feedback === 'CORRECT' ? (
                      <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-200">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 選択肢ボタン: スリム化 (py-3) */}
            <div className="w-full pt-1">
              {mode === 'EASY' ? (
                <div className="grid grid-cols-1 gap-2">
                  {options.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedback}
                      className={`py-3 md:py-5 px-4 rounded-2xl font-bold text-base md:text-xl transition-all border-2 shadow-sm ${
                        feedback === 'CORRECT' && opt === (direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english)
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : feedback === 'WRONG' && opt === (direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english)
                          ? 'bg-emerald-500 border-emerald-400 text-white animate-pulse'
                          : 'bg-white border-white text-slate-700 active:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <input 
                  autoFocus
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userInput)}
                  disabled={!!feedback}
                  placeholder="答えを入力..."
                  className="w-full py-4 px-6 bg-white border-2 border-slate-100 rounded-2xl text-lg md:text-2xl font-bold text-center focus:outline-none focus:border-blue-400 shadow-lg text-slate-800"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* 終了画面 */}
        {gameState === 'FINISHED' && (
          <motion.div 
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full text-center space-y-4 z-10"
          >
            <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl space-y-4">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black">Session Clear!</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">正解</p>
                  <p className="text-2xl font-black text-slate-800">{score}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">精度</p>
                  <p className="text-2xl font-black text-slate-800">
                    {totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setGameState('START')}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              TRY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
