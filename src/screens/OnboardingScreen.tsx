import React, { useState } from 'react';
import { UserProfile } from '../types';
import { CheckIcon } from '../components/ui/Icons';
import { ICON_SETS } from '../constants';
import { playSound } from '../services/soundService';
import { HeartIcon, BrainIcon, MoonIcon, ShieldIcon, TargetIcon } from '../components/ui/Icons';

interface OnboardingScreenProps {
  onComplete: (profile: UserProfile) => void;
}

const timelineData = [
  {
    id: 1,
    title: "AUTOCUIDADO",
    description: "Priorize seu bem-estar com rotinas de cuidado.",
    icon: HeartIcon,
  },
  {
    id: 2,
    title: "MINDFULNESS",
    description: "Pratique a atenção plena e viva o presente.",
    icon: BrainIcon,
  },
  {
    id: 3,
    title: "SONO",
    description: "Melhore a qualidade do seu descanso.",
    icon: MoonIcon,
  },
  {
    id: 4,
    title: "RESILIÊNCIA",
    description: "Desenvolva força emocional e supere desafios.",
    icon: ShieldIcon,
  },
  {
    id: 5,
    title: "FOCO",
    description: "Aumente sua concentração e produtividade.",
    icon: TargetIcon,
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [reason, setReason] = useState('');
  const [fade, setFade] = useState(true);

  const handleNext = () => {
    setFade(false);
    setTimeout(() => {
      if (step === questions.length - 1) {
        onComplete({ name, path, reason });
      } else {
        setStep(step + 1);
        setFade(true);
      }
    }, 200);
    playSound('select');
  };

  const handlePathSelect = (selectedPath: string) => {
    setPath(selectedPath);
    playSound('select');
  };

  const FeaturePreview = () => (
    <div className="mt-6 space-y-4 text-left animate-fade-in">
      <div className="flex items-center p-3 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="p-2 bg-blue-50 rounded-full mr-3 text-tranquili-blue">{ICON_SETS.default.reports}</div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Diário de Humor</h3>
          <p className="text-xs text-gray-600">Registre e entenda seus sentimentos.</p>
        </div>
      </div>
      <div className="flex items-center p-3 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="p-2 bg-green-50 rounded-full mr-3 text-green-500">{ICON_SETS.default.chat}</div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Tranquilinha IA</h3>
          <p className="text-xs text-gray-600">Converse e receba apoio a qualquer hora.</p>
        </div>
      </div>
      <div className="flex items-center p-3 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="p-2 bg-yellow-50 rounded-full mr-3 text-yellow-500">{ICON_SETS.default.games}</div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Pausa Mental</h3>
          <p className="text-xs text-gray-600">Jogos para acalmar a mente.</p>
        </div>
      </div>
    </div>
  );

  const PathSelector = () => (
    <div className="mt-6 grid grid-cols-1 gap-3 w-full max-w-sm">
      {timelineData.map((item) => {
        const Icon = item.icon;
        const isSelected = path === item.title;
        return (
          <button
            key={item.id}
            onClick={() => handlePathSelect(item.title)}
            className={`flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${
              isSelected
                ? 'border-tranquili-blue bg-tranquili-blue/10'
                : 'border-gray-200 bg-white hover:border-tranquili-blue/50'
            }`}
          >
            <div className={`p-2 rounded-full mr-3 ${isSelected ? 'bg-tranquili-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
            {isSelected && (
              <div className="w-6 h-6 rounded-full bg-tranquili-blue flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const questions = [
    {
      title: <>Bem-vindo ao <br /><span className="text-4xl block mt-2 text-tranquili-blue">Tranquili<span className="text-tranquili-yellow">+</span></span></>,
      subtitle: "Seu refúgio de calma, clareza e bem-estar.",
      content: null,
      showButton: true,
      buttonText: 'Começar Jornada',
    },
    {
      title: "Como você gostaria de ser chamado?",
      subtitle: <>Para tornarmos sua experiência <span className="text-tranquili-yellow">+</span> pessoal.</>,
      content: (
        <div className="mt-6 w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome ou apelido"
            className="w-full p-4 text-center text-xl bg-gray-50 border-b-2 border-gray-200 focus:border-tranquili-blue outline-none transition-colors rounded-t-lg text-gray-900 placeholder-gray-400"
            autoFocus
          />
        </div>
      ),
      showButton: true,
      buttonText: 'Continuar',
    },
    {
      title: `Olá, ${name}!`,
      subtitle: "Veja o que preparamos para o seu bem-estar:",
      content: <FeaturePreview />,
      showButton: true,
      buttonText: 'Explorar',
    },
    {
      title: "Qual é o seu foco principal?",
      subtitle: "Escolha um caminho para personalizarmos sua jornada.",
      content: <PathSelector />,
      showButton: true,
      buttonText: 'Escolher este caminho',
    },
    {
      title: "O que te traz aqui?",
      subtitle: "Conte-nos um pouco sobre seus objetivos ou como está se sentindo.",
      content: (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Escreva aqui..."
          className="mt-4 p-4 border border-gray-200 rounded-xl w-full h-32 focus:ring-2 focus:ring-tranquili-blue outline-none resize-none bg-gray-50 text-gray-900 placeholder-gray-400"
        />
      ),
      showButton: true,
      buttonText: 'Próximo',
    },
    {
      title: "Tudo pronto!",
      subtitle: "Seu espaço seguro foi criado com sucesso.",
      content: (
        <div className="mt-8 flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
            <CheckIcon className="w-12 h-12 text-green-600" />
          </div>
        </div>
      ),
      showButton: true,
      buttonText: 'Entrar no App',
    }
  ];

  const currentQuestion = questions[step];
  const isButtonDisabled = (step === 1 && !name) || (step === 3 && !path);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className={`w-full max-w-md text-center transition-opacity duration-200 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress */}
        <div className="flex gap-2 mb-8 justify-center">
          {questions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-8 bg-tranquili-blue' : idx < step ? 'w-4 bg-tranquili-blue/50' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.title}</h1>
        <p className="text-gray-600 mb-4">{currentQuestion.subtitle}</p>
        
        {currentQuestion.content}

        {/* Button */}
        {currentQuestion.showButton && (
          <button
            onClick={handleNext}
            disabled={isButtonDisabled}
            className={`mt-8 px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 ${
              isButtonDisabled
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-tranquili-blue hover:bg-blue-500 shadow-lg hover:shadow-xl'
            }`}
          >
            {currentQuestion.buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
