import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, RotateCcw, User, Cpu, Sparkles } from 'lucide-react';
import { ArrowLeftIcon, InfoIcon } from '../ui/Icons';
import { playSound } from '../../services/soundService';
import { supabase } from '@/integrations/supabase/client';

type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'gameOver';
type CellValue = 'red' | 'yellow' | null;

interface AiThought {
  text: string;
  round: number;
}

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={() => { playSound('select'); onClick(); }}
    className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-10 p-2"
  >
    <ArrowLeftIcon className="w-5 h-5" /> Voltar
  </button>
);

const ConnectDotsGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [board, setBoard] = useState<CellValue[][]>(
    Array(6).fill(null).map(() => Array(7).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<'human' | 'ai'>('human');
  const [winner, setWinner] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiThoughts, setAiThoughts] = useState<AiThought[]>([]);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [winningCells, setWinningCells] = useState<number[][]>([]);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [animatingPieces, setAnimatingPieces] = useState<Set<string>>(new Set());
  const [showThoughts, setShowThoughts] = useState(false);

  const checkWinner = (board: CellValue[][], row: number, col: number): CellValue => {
    const player = board[row][col];
    if (!player) return null;

    const directions: number[][][] = [
      [[0, 1], [0, -1]],
      [[1, 0], [-1, 0]],
      [[1, 1], [-1, -1]],
      [[1, -1], [-1, 1]],
    ];

    for (const [dir1, dir2] of directions) {
      const cells: number[][] = [[row, col]];
      for (const [dr, dc] of [dir1, dir2]) {
        let r = row + dr, c = col + dc;
        while (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
          cells.push([r, c]);
          r += dr;
          c += dc;
        }
      }
      if (cells.length >= 4) {
        setWinningCells(cells);
        return player;
      }
    }
    return null;
  };

  const isBoardFull = (board: CellValue[][]): boolean => {
    return board[0].every(cell => cell !== null);
  };

  const getAvailableRow = (board: CellValue[][], col: number): number => {
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === null) return row;
    }
    return -1;
  };

  const checkWinningMove = (board: CellValue[][], col: number, player: CellValue): boolean => {
    const row = getAvailableRow(board, col);
    if (row === -1) return false;
    const testBoard = board.map(r => [...r]);
    testBoard[row][col] = player;
    return checkWinner(testBoard, row, col) === player;
  };

  const getValidMoves = (board: CellValue[][]): number[] => {
    const moves: number[] = [];
    for (let col = 0; col < 7; col++) {
      if (getAvailableRow(board, col) !== -1) moves.push(col);
    }
    return moves;
  };

  const handleColumnClick = (col: number) => {
    if (gameState !== 'playing' || currentPlayer !== 'human' || isAIThinking) return;
    const row = getAvailableRow(board, col);
    if (row === -1) return;

    playSound('click');
    const pieceId = `${row}-${col}`;
    setAnimatingPieces(prev => new Set(prev).add(pieceId));

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 'red';
    setBoard(newBoard);
    setLastMove({ row, col });

    setTimeout(() => {
      setAnimatingPieces(prev => {
        const next = new Set(prev);
        next.delete(pieceId);
        return next;
      });
    }, 300);

    const w = checkWinner(newBoard, row, col);
    if (w) {
      playSound('victory');
      setWinner(w);
      setGameState('gameOver');
      return;
    }
    if (isBoardFull(newBoard)) {
      setWinner('draw');
      setGameState('gameOver');
      return;
    }
    setCurrentPlayer('ai');
  };

  useEffect(() => {
    if (currentPlayer !== 'ai' || gameState !== 'playing') return;

    const makeAIMove = async () => {
      setIsAIThinking(true);
      setAiThoughts([]);

      try {
        const { data, error } = await supabase.functions.invoke('connect-dots-ai', {
          body: { board, difficulty },
        });

        if (error) throw error;

        const { column: col, thoughts } = data;
        const roundNum = board.flat().filter(c => c).length + 1;

        if (thoughts) {
          for (let i = 0; i < thoughts.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            setAiThoughts(prev => [...prev, { text: thoughts[i], round: roundNum }]);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 400));

        const row = getAvailableRow(board, col);
        if (row !== -1) {
          playSound('click');
          const pieceId = `${row}-${col}`;
          setAnimatingPieces(prev => new Set(prev).add(pieceId));

          const newBoard = board.map(r => [...r]);
          newBoard[row][col] = 'yellow';
          setBoard(newBoard);
          setLastMove({ row, col });

          setTimeout(() => {
            setAnimatingPieces(prev => {
              const next = new Set(prev);
              next.delete(pieceId);
              return next;
            });
          }, 300);

          const w = checkWinner(newBoard, row, col);
          if (w) {
            playSound('error');
            setWinner(w);
            setGameState('gameOver');
          } else if (isBoardFull(newBoard)) {
            setWinner('draw');
            setGameState('gameOver');
          } else {
            setCurrentPlayer('human');
          }
        }
      } catch (error) {
        console.error('AI Error:', error);
        // Fallback local AI
        const validMoves = getValidMoves(board);
        let chosenMove: number | null = null;

        for (const col of validMoves) {
          if (checkWinningMove(board, col, 'yellow')) { chosenMove = col; break; }
        }
        if (chosenMove === null) {
          for (const col of validMoves) {
            if (checkWinningMove(board, col, 'red')) { chosenMove = col; break; }
          }
        }
        if (chosenMove === null) {
          const centerPriority = [3, 2, 4, 1, 5, 0, 6];
          for (const col of centerPriority) {
            if (validMoves.includes(col)) { chosenMove = col; break; }
          }
        }

        if (chosenMove !== null) {
          const row = getAvailableRow(board, chosenMove);
          playSound('click');
          const pieceId = `${row}-${chosenMove}`;
          setAnimatingPieces(prev => new Set(prev).add(pieceId));

          const newBoard = board.map(r => [...r]);
          newBoard[row][chosenMove] = 'yellow';
          setBoard(newBoard);
          setLastMove({ row, col: chosenMove });

          setTimeout(() => {
            setAnimatingPieces(prev => {
              const next = new Set(prev);
              next.delete(pieceId);
              return next;
            });
          }, 300);

          const w = checkWinner(newBoard, row, chosenMove);
          if (w) {
            playSound('error');
            setWinner(w);
            setGameState('gameOver');
          } else if (isBoardFull(newBoard)) {
            setWinner('draw');
            setGameState('gameOver');
          } else {
            setCurrentPlayer('human');
          }
        }
      } finally {
        setIsAIThinking(false);
      }
    };

    makeAIMove();
  }, [currentPlayer, gameState]);

  const startGame = (selectedDifficulty: Difficulty) => {
    playSound('select');
    setDifficulty(selectedDifficulty);
    setGameState('playing');
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer('human');
    setWinner(null);
    setAiThoughts([]);
    setLastMove(null);
    setWinningCells([]);
    setShowThoughts(false);
  };

  const resetGame = () => {
    playSound('select');
    setGameState('menu');
    setBoard(Array(6).fill(null).map(() => Array(7).fill(null)));
    setCurrentPlayer('human');
    setWinner(null);
    setAiThoughts([]);
    setLastMove(null);
    setWinningCells([]);
  };

  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
        <BackButton onClick={onBack} />

        <span className="text-6xl mb-4">🔵</span>
        <h1 className="text-3xl font-bold mb-2 text-foreground">Connect the Dots</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">Conecte 4 peças e vença a IA!</p>

        <div className="space-y-3 w-full max-w-xs">
          {([
            { diff: 'easy' as Difficulty, label: '😊 Fácil', desc: 'IA básica' },
            { diff: 'medium' as Difficulty, label: '🤔 Médio', desc: 'IA moderada' },
            { diff: 'hard' as Difficulty, label: '🔥 Difícil', desc: 'IA avançada' },
          ]).map(({ diff, label, desc }) => (
            <button
              key={diff}
              onClick={() => startGame(diff)}
              className="w-full py-3 px-6 bg-card border-2 border-border rounded-xl font-bold text-card-foreground hover:border-tranquili-blue hover:text-tranquili-blue transition-colors flex items-center justify-between"
            >
              <div className="text-left">
                <span className="block">{label}</span>
                <span className="text-xs font-normal text-muted-foreground">{desc}</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Playing / Game Over
  return (
    <div className="w-full pt-12 flex flex-col items-center animate-fade-in relative">
      <BackButton onClick={resetGame} />

      {/* Status bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
          currentPlayer === 'human'
            ? 'bg-red-100 text-red-700 shadow-sm'
            : 'bg-muted text-muted-foreground'
        }`}>
          <User className="w-3.5 h-3.5" />
          Você
        </div>
        <span className="text-muted-foreground text-sm">vs</span>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
          currentPlayer === 'ai'
            ? 'bg-amber-100 text-amber-700 shadow-sm'
            : 'bg-muted text-muted-foreground'
        }`}>
          <Cpu className="w-3.5 h-3.5" />
          IA
          {isAIThinking && (
            <span className="inline-block w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Board */}
      <div className="bg-tranquili-blue/20 rounded-2xl p-3 shadow-inner max-w-sm w-full">
        <div className="grid grid-cols-7 gap-1.5">
          {Array(7).fill(null).map((_, col) => (
            <div
              key={col}
              className="relative cursor-pointer"
              onClick={() => handleColumnClick(col)}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
            >
              {hoveredCol === col && currentPlayer === 'human' && !isAIThinking && gameState === 'playing' && (
                <div className="absolute inset-0 bg-tranquili-blue/10 rounded-lg pointer-events-none z-10" />
              )}

              {board.map((row, rowIndex) => {
                const isWinning = winningCells.some(([r, c]) => r === rowIndex && c === col);
                const isLastMoveCell = lastMove?.row === rowIndex && lastMove?.col === col;
                const isAnimating = animatingPieces.has(`${rowIndex}-${col}`);

                return (
                  <div
                    key={rowIndex}
                    className={`aspect-square rounded-full border-2 border-tranquili-blue/30 relative overflow-hidden transition-all duration-300 mb-1.5 ${
                      row[col] === null ? 'bg-white/80' : ''
                    } ${currentPlayer === 'human' && !isAIThinking && row[col] === null && gameState === 'playing' ? 'hover:bg-tranquili-blue/10' : ''}`}
                  >
                    {row[col] && (
                      <div className={`absolute inset-1 rounded-full ${
                        row[col] === 'red'
                          ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-md shadow-red-300/50'
                          : 'bg-gradient-to-br from-tranquili-yellow to-amber-400 shadow-md shadow-amber-300/50'
                      } ${isWinning ? 'animate-pulse ring-2 ring-white' : ''} ${
                        isAnimating ? 'animate-bounce' : ''
                      }`} />
                    )}
                    {isLastMoveCell && !isWinning && row[col] && (
                      <div className="absolute inset-0 border-2 border-tranquili-blue/40 rounded-full animate-ping" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* AI Thoughts Toggle */}
      {aiThoughts.length > 0 && (
        <button
          onClick={() => setShowThoughts(!showThoughts)}
          className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="w-4 h-4 text-tranquili-yellow" />
          {showThoughts ? 'Ocultar' : 'Ver'} pensamentos da IA
        </button>
      )}

      {showThoughts && aiThoughts.length > 0 && (
        <div className="mt-2 w-full max-w-sm bg-card rounded-xl border border-border p-3 space-y-2">
          {aiThoughts.slice().reverse().map((thought, index) => (
            <div
              key={aiThoughts.length - index - 1}
              className="bg-muted/50 rounded-lg p-2 text-sm"
              style={{ opacity: Math.max(0.4, 1 - index * 0.2) }}
            >
              <p className="text-foreground">{thought.text}</p>
              <p className="text-muted-foreground text-xs mt-0.5">Rodada {thought.round}</p>
            </div>
          ))}
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameOver' && (
        <div className="mt-6 text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-3">
            {winner === 'draw' ? (
              <span className="text-muted-foreground">🤝 Empate!</span>
            ) : winner === 'red' ? (
              <span className="text-red-500">🎉 Você Venceu!</span>
            ) : (
              <span className="text-amber-500">🤖 A IA Venceu!</span>
            )}
          </h2>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startGame(difficulty)}
              className="px-5 py-2.5 bg-tranquili-blue text-white font-bold rounded-xl inline-flex items-center gap-2 shadow-md hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" />
              Jogar Novamente
            </button>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
            >
              Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectDotsGame;
