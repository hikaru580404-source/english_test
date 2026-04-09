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
  ChevronRight,
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

  // --- Game Logic ---
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
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 flex items-center justify-center p-4 overflow-hidden relative">
      {/* 背景要素 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] right-[5%] w-[60%] h-[60%] bg-pink-400/20 rounded-full blur-[100px] animate-pulse" />

      <AnimatePresence mode="wait">
        {/* スタート画面 */}
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="max-w-md w-full text-center space-y-6 md:space-y-10 z-10"
          >
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur-md border border-white rounded-full shadow-sm text-sm font-medium text-slate-500"
            >
              MMC educations
            </motion.div>
            
            <div className="space-y-2">
              <motion.h1 
                className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                FlashCard8
              </motion.h1>
              <p className="text-slate-500 text-lg">Junior High English Mastery</p>
            </div>

            <div className="grid gap-3">
              <button 
                onClick={() => setDirection(prev => prev === 'EN_TO_JP' ? 'JP_TO_EN' : 'EN_TO_JP')}
                className="w-full p-4 bg-white/80 rounded-2xl border border-white flex items-center justify-between hover:bg-white transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl group-hover:rotate-180 transition-transform duration-500">
                    <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-semibold text-slate-700">学習方向</span>
                </div>
                <span className="text-blue-600 font-bold">
                  {direction === 'EN_TO_JP' ? '英 → 日' : '日 → 英'}
                </span>
              </button>

              <button 
                onClick={() => setMode(prev => prev === 'EASY' ? 'HARD' : 'EASY')}
                className="w-full p-4 bg-white/80 rounded-2xl border border-white flex items-center justify-between hover:bg-white transition-all shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl">
                    {mode === 'EASY' ? <Settings2 className="w-5 h-5 text-purple-500" /> : <Keyboard className="w-5 h-5 text-purple-500" />}
                  </div>
                  <span className="font-semibold text-slate-700">モード</span>
                </div>
                <span className="text-purple-600 font-bold">{mode === 'EASY' ? '3択' : '記述'}</span>
              </button>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
            >
              <Play className="w-6 h-6 fill-current" />
              START 10 MINS
            </button>
          </motion.div>
        )}

        {/* プレイ画面 */}
        {gameState === 'PLAYING' && currentWord && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl flex flex-col gap-4 md:gap-8 z-10"
          >
            {/* Header: Timer & Score */}
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm">
                <Timer className="w-4 h-4 text-blue-500" />
                <span className="font-mono font-bold text-slate-700">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-700">{score} / {totalAnswered}</span>
              </div>
            </div>

            {/* Flashcard Area */}
            <div className="relative h-[240px] md:h-[340px] w-full perspective-1000">
              <motion.div 
                animate={{ rotateY: isFlipping ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden bg-white/90 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3.5rem] border border-white shadow-2xl flex flex-col items-center justify-center p-6 text-center">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    {currentWord.partOfSpeech}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
                    {direction === 'EN_TO_JP' ? currentWord.english : currentWord.japanese}
                  </h2>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center p-6 text-center rotate-y-180">
                  <h2 className="text-4xl md:text-6xl font-bold text-white">
                    {direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english}
                  </h2>
                </div>
              </motion.div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-4 right-4 z-20 pointer-events-none"
                  >
                    {feedback === 'CORRECT' ? (
                      <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-200">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <div className="bg-rose-500 p-3 rounded-2xl shadow-lg shadow-rose-200">
                        <XCircle className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Answer Section */}
            <div className="w-full">
              {mode === 'EASY' ? (
                <div className="grid grid-cols-1 gap-2 md:gap-4">
                  {options.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedback}
                      className={`py-4 md:py-6 px-6 rounded-2xl md:rounded-[2rem] font-bold text-lg md:text-xl transition-all border-2 shadow-sm ${
                        feedback === 'CORRECT' && opt === (direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english)
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-100'
                          : feedback === 'WRONG' && opt === answerCheck(opt)
                            ? 'bg-rose-500 border-rose-400 text-white'
                            : 'bg-white border-white hover:border-blue-100 text-slate-700'
                      }`}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <input 
                    autoFocus
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userInput)}
                    disabled={!!feedback}
                    placeholder="答えを入力..."
                    className="w-full py-5 md:py-7 px-8 bg-white border-2 border-white rounded-3xl md:rounded-[2.5rem] text-xl md:text-2xl font-bold text-center focus:outline-none focus:border-blue-400 transition-all shadow-lg shadow-slate-100 placeholder:text-slate-300 text-slate-800"
                  />
                </div>
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
            className="max-w-md w-full text-center space-y-8 md:space-y-10 z-10"
          >
            <div className="p-8 md:p-12 bg-white/90 backdrop-blur-xl rounded-[3rem] border border-white shadow-2xl space-y-6">
              <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Session Complete!</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">正解数</p>
                  <p className="text-3xl font-black text-slate-800">{score}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">正答率</p>
                  <p className="text-3xl font-black text-slate-800">
                    {totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%
                  </p>
                </div>
              </div>
              <p className="text-slate-500 font-medium italic">MMC educations - Study Result</p>
            </div>

            <button 
              onClick={() => setGameState('START')}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
            >
              <RotateCcw className="w-6 h-6" />
              TRY AGAIN
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // 補助関数
  function answerCheck(opt: string) {
    if (!currentWord) return "";
    return direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english;
  }
}
