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
  HelpCircle
} from 'lucide-react';

// テスト用データセット
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
  userMastery: 'remembered' | 'unsure'; // 終了後にユーザーが選ぶ用
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);

  // Motion Values for Swipe logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  // オプション（選択肢）の生成
  const generateOptions = useCallback((correctWord: typeof WORDS[0]) => {
    const wrong = WORDS.find(w => w.id !== correctWord.id) || WORDS[0];
    // 右（[0]）が選択肢1、左（[1]）が選択肢2とする
    // ユーザーの指示「右（選択肢1）左（選択肢2）」に従い、ランダムに入れ替え
    return Math.random() > 0.5 
      ? [correctWord.japanese, wrong.japanese] 
      : [wrong.japanese, correctWord.japanese];
  }, []);

  const startGame = () => {
    setResults([]);
    setCurrentIndex(0);
    setTimeLeft(180);
    const firstWord = WORDS[0];
    setQuizOptions(generateOptions(firstWord));
    setGameState('PLAYING');
  };

  const handleSwipe = (direction: 'right' | 'left') => {
    const currentWord = WORDS[currentIndex % WORDS.length];
    const selectedAnswer = direction === 'right' ? quizOptions[0] : quizOptions[1];
    const isCorrect = selectedAnswer === currentWord.japanese;

    // ハプティクス
    if (window.navigator.vibrate) window.navigator.vibrate(50);

    // 履歴追加
    setResults(prev => [...prev, { word: currentWord, isCorrect, userMastery: 'unsure' }]);

    // 次の単語へ
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setQuizOptions(generateOptions(WORDS[nextIdx % WORDS.length]));
    x.set(0); // 位置をリセット
  };

  // セルフ仕分けのトグル
  const toggleMastery = (index: number) => {
    setResults(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, userMastery: item.userMastery === 'remembered' ? 'unsure' : 'remembered' } 
        : item
    ));
    if (window.navigator.vibrate) window.navigator.vibrate(30);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setGameState('FINISHED');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {/* スタート画面 */}
        {gameState === 'START' && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-8">
            <h1 className="text-6xl font-black text-slate-900 tracking-tight">SwipeSprint <span className="text-blue-500">8</span></h1>
            <p className="text-slate-500 text-xl font-medium">左右スワイプで正しい日本語を選ぼう</p>
            <button onClick={startGame} className="px-16 py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto">
              <Play fill="currentColor" /> START
            </button>
          </motion.div>
        )}

        {/* プレイ画面 */}
        {gameState === 'PLAYING' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md flex flex-col gap-8">
            <div className="flex justify-between items-center bg-white px-6 py-4 rounded-3xl shadow-sm border border-white">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl tabular-nums">
                <Timer size={24} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-slate-400 font-bold">Q. {results.length + 1}</div>
            </div>

            <div className="relative h-[400px] w-full flex items-center justify-center perspective-1000">
              {/* 下に隠れている選択肢のガイド */}
              <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
                <div className="bg-rose-100 text-rose-600 p-4 rounded-2xl font-bold text-sm vertical-rl border border-rose-200 shadow-sm">
                  {quizOptions[1]} (左)
                </div>
                <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl font-bold text-sm vertical-rl border border-emerald-200 shadow-sm">
                  {quizOptions[0]} (右)
                </div>
              </div>

              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, rotate, opacity }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) handleSwipe('right');
                  else if (info.offset.x < -100) handleSwipe('left');
                }}
                className="z-10 w-full h-full bg-white rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center justify-center p-10 cursor-grab active:cursor-grabbing touch-none"
              >
                <span className="text-blue-500 font-bold tracking-widest text-xs mb-4 uppercase bg-blue-50 px-3 py-1 rounded-full">
                  {WORDS[currentIndex % WORDS.length].partOfSpeech}
                </span>
                <h2 className="text-6xl font-black text-slate-900 text-center leading-tight">
                  {WORDS[currentIndex % WORDS.length].english}
                </h2>
                <div className="mt-12 flex items-center gap-2 text-slate-300 font-bold animate-bounce">
                  <span>SWIPE TO ANSWER</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 結果・一覧仕分け画面 */}
        {gameState === 'FINISHED' && (
          <motion.div key="finished" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl flex flex-col gap-6">
            <div className="text-center">
              <Trophy size={64} className="mx-auto text-orange-400 mb-2" />
              <h2 className="text-4xl font-black text-slate-900">Session Review</h2>
              <p className="text-slate-500 font-bold mt-1">正解した単語も、もう一度仕分けましょう</p>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-xl overflow-hidden">
              <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {results.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm group">
                    <div className="flex items-center gap-4">
                      {item.isCorrect ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-rose-400" size={24} />}
                      <div>
                        <div className="text-xl font-bold text-slate-900">{item.word.english}</div>
                        <div className="text-sm text-slate-500 font-medium">{item.word.japanese}</div>
                      </div>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                      <button
                        onClick={() => toggleMastery(i)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          item.userMastery === 'remembered' 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <BrainCircuit size={16} /> 覚えた
                      </button>
                      <button
                        onClick={() => toggleMastery(i)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                          item.userMastery === 'unsure' 
                            ? 'bg-rose-400 text-white shadow-md' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <HelpCircle size={16} /> 不安
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setGameState('START')} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xl flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 transition-colors">
              <RotateCcw size={22} /> FINISH & RESTART
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .vertical-rl { writing-mode: vertical-rl; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
