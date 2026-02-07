import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimax with alpha-beta pruning for Connect Four AI
function getAvailableRow(board: (string | null)[][], col: number): number {
  for (let row = 5; row >= 0; row--) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

function getValidMoves(board: (string | null)[][]): number[] {
  const moves: number[] = [];
  for (let col = 0; col < 7; col++) {
    if (getAvailableRow(board, col) !== -1) moves.push(col);
  }
  return moves;
}

function checkWinAt(board: (string | null)[][], row: number, col: number): string | null {
  const player = board[row][col];
  if (!player) return null;
  const directions = [
    [[0, 1], [0, -1]],
    [[1, 0], [-1, 0]],
    [[1, 1], [-1, -1]],
    [[1, -1], [-1, 1]],
  ];
  for (const [dir1, dir2] of directions) {
    let count = 1;
    for (const [dr, dc] of [dir1, dir2]) {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
        count++;
        r += dr;
        c += dc;
      }
    }
    if (count >= 4) return player;
  }
  return null;
}

function evaluateWindow(window: (string | null)[], aiPiece: string, humanPiece: string): number {
  let score = 0;
  const aiCount = window.filter(c => c === aiPiece).length;
  const humanCount = window.filter(c => c === humanPiece).length;
  const emptyCount = window.filter(c => c === null).length;
  if (aiCount === 4) score += 100;
  else if (aiCount === 3 && emptyCount === 1) score += 5;
  else if (aiCount === 2 && emptyCount === 2) score += 2;
  if (humanCount === 3 && emptyCount === 1) score -= 4;
  return score;
}

function scorePosition(board: (string | null)[][], aiPiece: string, humanPiece: string): number {
  let score = 0;
  // Center column preference
  const centerCol = board.map(r => r[3]);
  score += centerCol.filter(c => c === aiPiece).length * 3;
  // Horizontal
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      score += evaluateWindow([board[r][c], board[r][c+1], board[r][c+2], board[r][c+3]], aiPiece, humanPiece);
    }
  }
  // Vertical
  for (let c = 0; c < 7; c++) {
    for (let r = 0; r < 3; r++) {
      score += evaluateWindow([board[r][c], board[r+1][c], board[r+2][c], board[r+3][c]], aiPiece, humanPiece);
    }
  }
  // Diagonal
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      score += evaluateWindow([board[r][c], board[r+1][c+1], board[r+2][c+2], board[r+3][c+3]], aiPiece, humanPiece);
    }
  }
  for (let r = 0; r < 3; r++) {
    for (let c = 3; c < 7; c++) {
      score += evaluateWindow([board[r][c], board[r+1][c-1], board[r+2][c-2], board[r+3][c-3]], aiPiece, humanPiece);
    }
  }
  return score;
}

function isTerminal(board: (string | null)[][]): boolean {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      if (board[r][c] && checkWinAt(board, r, c)) return true;
    }
  }
  return getValidMoves(board).length === 0;
}

function minimax(
  board: (string | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPiece: string,
  humanPiece: string
): [number | null, number] {
  const validMoves = getValidMoves(board);
  const terminal = isTerminal(board);

  if (depth === 0 || terminal) {
    if (terminal) {
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 7; c++) {
          if (board[r][c]) {
            const w = checkWinAt(board, r, c);
            if (w === aiPiece) return [null, 100000];
            if (w === humanPiece) return [null, -100000];
          }
        }
      }
      return [null, 0]; // draw
    }
    return [null, scorePosition(board, aiPiece, humanPiece)];
  }

  if (maximizingPlayer) {
    let value = -Infinity;
    let bestCol = validMoves[Math.floor(Math.random() * validMoves.length)];
    for (const col of validMoves) {
      const row = getAvailableRow(board, col);
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = aiPiece;
      const [, newScore] = minimax(newBoard, depth - 1, alpha, beta, false, aiPiece, humanPiece);
      if (newScore > value) {
        value = newScore;
        bestCol = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  } else {
    let value = Infinity;
    let bestCol = validMoves[Math.floor(Math.random() * validMoves.length)];
    for (const col of validMoves) {
      const row = getAvailableRow(board, col);
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = humanPiece;
      const [, newScore] = minimax(newBoard, depth - 1, alpha, beta, true, aiPiece, humanPiece);
      if (newScore < value) {
        value = newScore;
        bestCol = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return [bestCol, value];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { board, difficulty } = await req.json();

    const depthMap: Record<string, number> = {
      easy: 2,
      medium: 4,
      hard: 6,
    };

    const depth = depthMap[difficulty] || 4;
    const aiPiece = "yellow";
    const humanPiece = "red";

    const [bestCol] = minimax(board, depth, -Infinity, Infinity, true, aiPiece, humanPiece);

    const thoughts = [];
    if (difficulty === "easy") {
      thoughts.push("Analisando jogadas simples...");
      thoughts.push(`Coluna ${bestCol} parece boa!`);
    } else if (difficulty === "medium") {
      thoughts.push("Avaliando posição do tabuleiro...");
      thoughts.push("Considerando ameaças e oportunidades.");
      thoughts.push(`Melhor jogada: coluna ${bestCol}`);
    } else {
      thoughts.push("Análise profunda do tabuleiro em andamento...");
      thoughts.push("Calculando múltiplas jogadas à frente.");
      thoughts.push("Avaliando sequências de vitória e defesa.");
      thoughts.push(`Jogada ótima encontrada: coluna ${bestCol}`);
    }

    return new Response(
      JSON.stringify({ column: bestCol, thoughts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Connect Dots AI error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
