import React, { useState } from 'react';
import { playSound } from '../services/soundService';
import { ArrowLeftIcon, InfoIcon, SparklesIcon, XIcon } from '../components/ui/Icons';

type GameType = 'memory' | 'sequence' | 'mindfulness' | null;
type Difficulty = 'easy' | 'medium' | 'hard';

interface CardType {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_EMOJIS = ['😊', '😌', '😐', '😢', '😟', '🥳', '🤯', '🤩', '😴', '🤔', '😇', '😂'];

const DIFFICULTY_SETTINGS: Record<Difficulty, { pairs: number; grid: string; cardSize: string }> = {
  easy: { pairs: 6, grid: 'grid-cols-4 gap-3', cardSize: 'w-16 h-16 md:w-20 md:h-20' },
  medium: { pairs: 8, grid: 'grid-cols-4 gap-3', cardSize: 'w-16 h-16 md:w-20 md:h-20' },
  hard: { pairs: 10, grid: 'grid-cols-5 gap-2', cardSize: 'w-14 h-14 md:w-16 md:h-16' },
};

const GAME_INSTRUCTIONS = {
  memory: { title: "Jogo da Memória", instructions: "Encontre os pares de emojis. Tente usar o menor número de movimentos possível." },
  sequence: { title: "Neuro-Sequência", instructions: "Repita a sequência de luzes. A cada acerto, ela fica mais longa." },
  mindfulness: { title: "5 Sentidos", instructions: "Ancore-se no presente listando coisas que você vê, toca, ouve, cheira e saboreia." },
};

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const generateCards = (pairCount: number): CardType[] => {
  const emojiSubset = shuffleArray(MEMORY_EMOJIS).slice(0, pairCount);
  return shuffleArray([...emojiSubset, ...emojiSubset]).map((emoji, index) => ({
    id: index, emoji, isFlipped: false, isMatched: false,
  }));
};

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={() => { playSound('select'); onClick(); }}
    className="absolute top-4 left-4 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors z-10 p-2"
  >
    <ArrowLeftIcon className="w-5 h-5" /> Voltar
  </button>
);

const HelpButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={() => { playSound('toggle'); onClick(); }}
    className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors z-10"
  >
    <InfoIcon className="w-6 h-6" />
  </button>
);

const HelpModal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center relative">
      <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
        <XIcon className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <div className="text-gray-600 text-left space-y-2">{children}</div>
    </div>
  </div>
);

const MemoryGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const startGame = (diff: Difficulty) => {
    playSound('select');
    const newCards = generateCards(DIFFICULTY_SETTINGS[diff].pairs);
    setCards(newCards);
    setDifficulty(diff);
    setMoves(0);
    setGameOver(false);
  };

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;
    playSound('click');

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);
    setFlippedCards([...flippedCards, id]);

    if (flippedCards.length === 1) {
      setMoves(moves + 1);
      const firstCard = cards[flippedCards[0]];
      const secondCard = newCards[id];

      if (firstCard.emoji === secondCard.emoji) {
        playSound('match');
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isMatched: true }
              : c
          ));
          setFlippedCards([]);
          
          const allMatched = newCards.every(c => c.id === firstCard.id || c.id === secondCard.id || c.isMatched);
          if (allMatched) {
            setTimeout(() => {
              playSound('victory');
              setGameOver(true);
            }, 300);
          }
        }, 300);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  if (!difficulty) {
    return (
      <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
        <BackButton onClick={onBack} />
        <HelpButton onClick={() => setShowHelp(true)} />
        
        {showHelp && (
          <HelpModal title={GAME_INSTRUCTIONS.memory.title} onClose={() => setShowHelp(false)}>
            <p>{GAME_INSTRUCTIONS.memory.instructions}</p>
          </HelpModal>
        )}

        <span className="text-6xl mb-4">🧠</span>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Jogo da Memória</h1>
        <p className="text-gray-600 mb-8 max-w-sm">Escolha a dificuldade:</p>
        
        <div className="space-y-3 w-full max-w-xs">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => startGame(diff)}
              className="w-full py-3 px-6 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:border-tranquili-blue hover:text-tranquili-blue transition-colors"
            >
              {diff === 'easy' ? '😊 Fácil' : diff === 'medium' ? '🤔 Médio' : '🔥 Difícil'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
        <span className="text-6xl mb-4">🎉</span>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Parabéns!</h1>
        <p className="text-gray-600 mb-6">Você completou em {moves} movimentos!</p>
        <div className="space-x-4">
          <button
            onClick={() => startGame(difficulty)}
            className="px-6 py-3 bg-tranquili-blue text-white font-bold rounded-xl"
          >
            Jogar Novamente
          </button>
          <button
            onClick={() => setDifficulty(null)}
            className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl"
          >
            Mudar Dificuldade
          </button>
        </div>
      </div>
    );
  }

  const settings = DIFFICULTY_SETTINGS[difficulty];

  return (
    <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
      <BackButton onClick={() => setDifficulty(null)} />
      
      <h2 className="text-xl font-bold mb-4 text-gray-800">Movimentos: {moves}</h2>
      
      <div className={`grid ${settings.grid} max-w-md mx-auto`}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`${settings.cardSize} rounded-xl font-bold text-2xl transition-all duration-300 transform ${
              card.isFlipped || card.isMatched
                ? 'bg-white border-2 border-tranquili-blue rotate-0'
                : 'bg-gradient-to-br from-tranquili-blue to-blue-400 text-white hover:scale-105'
            } ${card.isMatched ? 'opacity-50' : ''}`}
            disabled={card.isMatched}
          >
            {card.isFlipped || card.isMatched ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};

const SequenceGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const colors = [
    'bg-red-400 hover:bg-red-500',
    'bg-blue-400 hover:bg-blue-500',
    'bg-green-400 hover:bg-green-500',
    'bg-yellow-400 hover:bg-yellow-500',
  ];

  const startGame = () => {
    playSound('select');
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setGameOver(false);
    addToSequence([]);
  };

  const addToSequence = (currentSequence: number[]) => {
    const newNumber = Math.floor(Math.random() * 4);
    const newSequence = [...currentSequence, newNumber];
    setSequence(newSequence);
    setIsPlaying(true);
    showSequence(newSequence);
  };

  const showSequence = async (seq: number[]) => {
    setIsShowingSequence(true);
    setPlayerSequence([]);
    
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveButton(seq[i]);
      playSound('click');
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveButton(null);
    }
    
    setIsShowingSequence(false);
  };

  const handleButtonClick = (index: number) => {
    if (isShowingSequence) return;
    playSound('click');
    setActiveButton(index);
    setTimeout(() => setActiveButton(null), 200);

    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);

    const currentIndex = newPlayerSequence.length - 1;
    if (newPlayerSequence[currentIndex] !== sequence[currentIndex]) {
      playSound('error');
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      playSound('win');
      setScore(sequence.length);
      setTimeout(() => addToSequence(sequence), 1000);
    }
  };

  if (!isPlaying && !gameOver) {
    return (
      <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
        <BackButton onClick={onBack} />
        <HelpButton onClick={() => setShowHelp(true)} />
        
        {showHelp && (
          <HelpModal title={GAME_INSTRUCTIONS.sequence.title} onClose={() => setShowHelp(false)}>
            <p>{GAME_INSTRUCTIONS.sequence.instructions}</p>
          </HelpModal>
        )}

        <span className="text-6xl mb-4">🎵</span>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Neuro-Sequência</h1>
        <p className="text-gray-600 mb-8 max-w-sm">Memorize e repita a sequência de cores!</p>
        
        <button
          onClick={startGame}
          className="px-8 py-3 bg-gradient-to-r from-tranquili-blue to-blue-400 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
        >
          <SparklesIcon className="w-5 h-5" /> Começar
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
        <span className="text-6xl mb-4">😅</span>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Game Over!</h1>
        <p className="text-gray-600 mb-6">Sua pontuação: {score}</p>
        <button
          onClick={startGame}
          className="px-8 py-3 bg-tranquili-blue text-white font-bold rounded-xl"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
      <BackButton onClick={() => { setIsPlaying(false); setGameOver(false); }} />
      
      <h2 className="text-xl font-bold mb-4 text-gray-800">Sequência: {sequence.length}</h2>
      <p className="text-gray-500 mb-6">
        {isShowingSequence ? 'Observe a sequência...' : 'Sua vez! Repita a sequência.'}
      </p>
      
      <div className="grid grid-cols-2 gap-4 max-w-xs">
        {colors.map((color, index) => (
          <button
            key={index}
            onClick={() => handleButtonClick(index)}
            disabled={isShowingSequence}
            className={`w-24 h-24 rounded-2xl transition-all duration-200 ${color} ${
              activeButton === index ? 'scale-110 brightness-125 ring-4 ring-white' : ''
            } ${isShowingSequence ? 'cursor-not-allowed' : ''}`}
          />
        ))}
      </div>
    </div>
  );
};

const MindfulnessGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  const steps = [
    { count: 5, label: 'coisas que você VÊ', emoji: '👀' },
    { count: 4, label: 'coisas que você TOCA', emoji: '✋' },
    { count: 3, label: 'coisas que você OUVE', emoji: '👂' },
    { count: 2, label: 'coisas que você CHEIRA', emoji: '👃' },
    { count: 1, label: 'coisa que você SABOREIA', emoji: '👅' },
  ];

  const currentStepData = steps[currentStep];

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleNext = () => {
    playSound('confirm');
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setInputs([]);
    } else {
      playSound('victory');
      setCurrentStep(steps.length);
    }
  };

  if (currentStep === steps.length) {
    return (
      <div className="w-full text-center pt-12 flex flex-col items-center animate-fade-in">
        <BackButton onClick={onBack} />
        <span className="text-6xl mb-4">🧘</span>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Exercício Completo!</h1>
        <p className="text-gray-600 mb-6">Parabéns! Você completou o exercício de mindfulness.</p>
        <button
          onClick={() => { setCurrentStep(0); setInputs([]); }}
          className="px-8 py-3 bg-tranquili-blue text-white font-bold rounded-xl"
        >
          Fazer Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full text-center pt-12 flex flex-col items-center max-w-md mx-auto animate-fade-in">
      <BackButton onClick={onBack} />
      <HelpButton onClick={() => setShowHelp(true)} />
      
      {showHelp && (
        <HelpModal title={GAME_INSTRUCTIONS.mindfulness.title} onClose={() => setShowHelp(false)}>
          <p>{GAME_INSTRUCTIONS.mindfulness.instructions}</p>
        </HelpModal>
      )}

      <span className="text-6xl mb-4">{currentStepData.emoji}</span>
      <h2 className="text-2xl font-bold mb-2 text-gray-900">
        Observe {currentStepData.count} {currentStepData.label}
      </h2>
      <p className="text-gray-500 mb-6 italic">
        Digite ou apenas pense neles enquanto respira fundo.
      </p>
      
      <div className="w-full space-y-3 mb-8">
        {Array.from({ length: currentStepData.count }).map((_, i) => (
          <input
            key={i}
            value={inputs[i] || ''}
            onChange={(e) => handleInputChange(i, e.target.value)}
            placeholder={`Item ${i + 1}`}
            className="w-full p-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-tranquili-blue outline-none shadow-sm"
          />
        ))}
      </div>
      
      <button
        onClick={handleNext}
        className="px-8 py-3 bg-tranquili-blue text-white font-bold rounded-lg shadow-lg"
      >
        Próximo
      </button>
    </div>
  );
};

const GamesScreen: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>(null);

  const games = [
    { id: 'memory' as GameType, emoji: '🧠', title: 'Jogo da Memória', description: 'Encontre os pares!' },
    { id: 'sequence' as GameType, emoji: '🎵', title: 'Neuro-Sequência', description: 'Memorize e repita' },
    { id: 'mindfulness' as GameType, emoji: '🧘', title: '5 Sentidos', description: 'Exercício de mindfulness' },
  ];

  if (selectedGame === 'memory') {
    return (
      <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
        <MemoryGame onBack={() => setSelectedGame(null)} />
      </div>
    );
  }

  if (selectedGame === 'sequence') {
    return (
      <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
        <SequenceGame onBack={() => setSelectedGame(null)} />
      </div>
    );
  }

  if (selectedGame === 'mindfulness') {
    return (
      <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
        <MindfulnessGame onBack={() => setSelectedGame(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Pausa Mental</h1>
      <p className="text-gray-600 mb-6">Escolha um jogo para relaxar sua mente</p>

      <div className="space-y-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => { playSound('select'); setSelectedGame(game.id); }}
            className="w-full bg-white p-5 rounded-xl shadow-md flex items-center gap-4 hover:shadow-lg transition-shadow"
          >
            <span className="text-4xl">{game.emoji}</span>
            <div className="text-left">
              <h3 className="font-bold text-gray-800">{game.title}</h3>
              <p className="text-sm text-gray-500">{game.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GamesScreen;
