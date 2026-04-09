/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

type GameState = 'START' | 'PLAYING' | 'FINISHED';
type Mode = 'EASY' | 'HARD';
type Direction = 'EN_TO_JP' | 'JP_TO_EN';

// Robust Fisher-Yates Shuffle to ensure true randomness
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [mode, setMode] = useState<Mode>('EASY');
  const [direction, setDirection] = useState<Direction>('EN_TO_JP');
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Background Elements - Vibrant Gradients on White */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[10%] left-[5%] w-[60%] h-[60%] bg-blue-400/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[60%] h-[60%] bg-pink-400/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[40%] h-[40%] bg-yellow-300/20 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="max-w-md w-full text-center space-y-10"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur-md border border-white rounded-full shadow-sm"
              >
                <span className="text-sm font-bold tracking-widest text-blue-600 uppercase">MMC educations</span>
              </motion.div>
              <div className="space-y-1">
                <motion.h1 
                  className="text-7xl font-display font-extrabold tracking-tight text-slate-900 drop-shadow-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  FlashCard<span className="text-blue-500">8</span>
                </motion.h1>
                <p className="text-slate-500 font-medium">Junior High English Mastery</p>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-[2.5rem] p-8 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('EASY')}
                  className={`p-5 rounded-3xl transition-all flex flex-col items-center gap-2 shadow-sm ${
                    mode === 'EASY' 
                    ? 'bg-blue-500 text-white shadow-blue-200' 
                    : 'bg-white/80 text-slate-500 hover:bg-white'
                  }`}
                >
                  <Settings2 size={24} />
                  <span className="font-bold">Easy</span>
                </button>
                <button
                  onClick={() => setMode('HARD')}
                  className={`p-5 rounded-3xl transition-all flex flex-col items-center gap-2 shadow-sm ${
                    mode === 'HARD' 
                    ? 'bg-blue-500 text-white shadow-blue-200' 
                    : 'bg-white/80 text-slate-500 hover:bg-white'
                  }`}
                >
                  <Keyboard size={24} />
                  <span className="font-bold">Hard</span>
                </button>
              </div>

              <button
                onClick={() => setDirection(prev => prev === 'EN_TO_JP' ? 'JP_TO_EN' : 'EN_TO_JP')}
                className="w-full p-5 bg-white/80 rounded-3xl border border-white flex items-center justify-between hover:bg-white transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <ArrowRightLeft size={20} className="text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className="font-bold text-slate-700 md:text-base text-sm">
                    {direction === 'EN_TO_JP' ? 'English → Japanese' : 'Japanese → English'}
                  </span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>

              <button
                onClick={startGame}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
              >
                <Play size={20} fill="currentColor" />
                START 10 MINS
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && currentWord && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl flex flex-col gap-4 md:gap-8" // スマホではgap-4、PCではgap-8に
          >
            {/* Header Info - iOS Style Pill */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 md:gap-3 bg-white/80 backdrop-blur-xl px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white shadow-sm">
                <Timer size={18} className="text-blue-500" />
                <span className="font-display font-bold text-lg md:text-xl tabular-nums text-slate-900">{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 bg-white/80 backdrop-blur-xl px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-white shadow-sm">
                <Trophy size={18} className="text-orange-400" />
                <span className="font-display font-bold text-lg md:text-xl text-slate-900">{score}</span>
                <span className="text-slate-400 text-xs md:text-sm font-medium">/ {totalAnswered}</span>
              </div>
            </div>

            {/* Flashcard - Bubble Feel */}
            <div className="relative h-[240px] md:h-[340px] w-full perspective-1000"> {/* スマホで高さを240pxに縮小 */}
              <motion.div
                animate={{ rotateY: isFlipping ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                className="w-full h-full relative preserve-3d"
              >
                {/* Front */}
                <div className="absolute inset-0 bg-white border border-white rounded-[2rem] md:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center p-4 md:p-8 backface-hidden">
                  <div className="px-4 py-1 bg-blue-50 rounded-full mb-3 md:mb-6">
                    <span className="text-blue-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">
                      {currentWord.partOfSpeech}
                    </span>
                  </div>
                  {/* スマホで文字サイズを少し縮小 (text-4xl) */}
                  <h2 className="text-4xl md:text-8xl font-display font-extrabold text-center text-slate-900 break-words max-w-full">
                    {direction === 'EN_TO_JP' ? currentWord.english : currentWord.japanese}
                  </h2>
                </div>

                {/* Back */}
                <div className="absolute inset-0 bg-blue-500 border border-blue-400 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-4 md:p-8 backface-hidden rotate-y-180">
                  <h2 className="text-3xl md:text-7xl font-display font-extrabold text-center text-white">
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
                    className="absolute top-4 right-4 md:top-6 md:right-6 z-20 pointer-events-none"
                  >
                    {feedback === 'CORRECT' ? (
                      <div className="bg-emerald-500/80 backdrop-blur-sm text-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-emerald-200/50">
                        <CheckCircle2 size={24} className="md:w-8 md:h-8" />
                      </div>
                    ) : (
                      <div className="bg-rose-500/80 backdrop-blur-sm text-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-lg shadow-rose-200/50">
                        <XCircle size={24} className="md:w-8 md:h-8" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Answer Section - Bubble Buttons */}
            <div className="px-2">
              {mode === 'EASY' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"> {/* スマホでボタンの間隔を狭める */}
                  {options.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!feedback}
                      /* スマホでボタンの高さ(py)と文字サイズ(text-lg)を縮小 */
                      className={`py-4 px-4 md:py-6 md:px-6 rounded-2xl md:rounded-[2rem] font-bold text-lg md:text-xl transition-all border-2 shadow-sm ${
                        feedback === 'CORRECT' && opt === (direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english)
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-100'
                          : feedback === 'WRONG' && opt === (direction === 'EN_TO_JP' ? currentWord.japanese : currentWord.english)
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-100'
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
                    placeholder="Type the answer..."
                    /* スマホでInputの高さを縮小 */
                    className="w-full py-4 px-6 md:py-7 md:px-10 bg-white border-2 border-white rounded-3xl md:rounded-[2.5rem] text-xl md:text-2xl font-bold text-center focus:outline-none focus:border-blue-400 transition-all shadow-lg shadow-slate-100 placeholder:text-slate-300 text-slate-800"
                  />
                  <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-blue-200 pointer-events-none">
                    <Keyboard size={24} className="md:w-7 md:h-7" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-10"
          >
            <div className="space-y-4">
              <div className="inline-flex p-8 bg-orange-100 rounded-full text-orange-500 mb-2 shadow-inner">
                <Trophy size={72} />
              </div>
              <h1 className="text-5xl font-display font-extrabold text-slate-900">Session Complete!</h1>
              <p className="text-slate-500 font-medium">MMC educations - Study Result</p>
            </div>

            <div className="bg-white/80 backdrop-blur-2xl border border-white p-10 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]">
              <div className="grid grid-cols-2 gap-10 mb-10">
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Accuracy</p>
                  <p className="text-5xl font-display font-extrabold text-blue-500 italic">
                    {totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Words</p>
                  <p className="text-5xl font-display font-extrabold text-pink-500 italic">{score}</p>
                </div>
              </div>

              <button
                onClick={() => setGameState('START')}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold text-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
              >
                <RotateCcw size={20} />
                TRY AGAIN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
