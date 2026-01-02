import React, { useState } from 'react';
import { UserProfile } from '../types';
import { CheckIcon } from '../components/ui/Icons';
import { ICON_SETS } from '../constants';
import { playSound } from '../services/soundService';
import { HeartIcon, BrainIcon, MoonIcon, ShieldIcon, TargetIcon } from '../components/ui/Icons';
import AuthSwitch from '../components/ui/auth-switch';
import LoginForm from '../components/LoginForm';
import logoImage from '../assets/Logo.png';
import ProgressIndicator from '../components/ui/progress-indicator';

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
  const [authMode, setAuthMode] = useState<'choose' | 'new' | 'login'>('choose');

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

  const handleNewUser = () => {
    playSound('select');
    setAuthMode('new');
    setStep(1); // Go to name input step
  };

  const handleExistingUser = () => {
    playSound('select');
    setAuthMode('login');
  };

  const handleLogin = (email: string, password: string) => {
    // For demo purposes, just complete with default profile
    // In a real app, this would authenticate with backend
    const savedName = email.split('@')[0];
    onComplete({ name: savedName, path: 'AUTOCUIDADO', reason: 'Usuário existente' });
  };

  const handleBackToChoose = () => {
    playSound('select');
    setAuthMode('choose');
    setStep(0);
  };

  const FeaturePreview = () => (
    <div className="mt-6 space-y-4 text-left animate-fade-in">
      <div className="flex items-center p-3 bg-card border border-border shadow-sm rounded-xl">
        <div className="p-2 bg-primary/10 rounded-full mr-3 text-primary">{ICON_SETS.default.reports}</div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Diário de Humor</h3>
          <p className="text-xs text-muted-foreground">Registre e entenda seus sentimentos.</p>
        </div>
      </div>
      <div className="flex items-center p-3 bg-card border border-border shadow-sm rounded-xl">
        <div className="p-2 bg-green-500/10 rounded-full mr-3 text-green-500">{ICON_SETS.default.chat}</div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Tranquilinha IA</h3>
          <p className="text-xs text-muted-foreground">Converse e receba apoio a qualquer hora.</p>
        </div>
      </div>
      <div className="flex items-center p-3 bg-card border border-border shadow-sm rounded-xl">
        <div className="p-2 bg-accent/20 rounded-full mr-3 text-accent-foreground">{ICON_SETS.default.games}</div>
        <div>
          <h3 className="font-bold text-foreground text-sm">Pausa Mental</h3>
          <p className="text-xs text-muted-foreground">Jogos para acalmar a mente.</p>
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
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className={`p-2 rounded-full mr-3 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            {isSelected && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <CheckIcon className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  // Auth Choose Screen - First screen with white background and blue animation
  const AuthChooseScreen = () => (
    <div className="min-h-screen bg-card flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-fade-in">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/20 pulse-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-primary/10 pulse-ring pulse-ring-delay-1" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-primary/5 pulse-ring pulse-ring-delay-2" />
          </div>
          
          {/* Logo */}
          <div className="relative z-10 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Tranquili+ Logo" 
              className="w-32 h-32 object-cover rounded-full animate-float drop-shadow-lg"
            />
          </div>
        </div>

        {/* Brand Text */}
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Tranquili<span className="text-accent">+</span>
        </h1>
        <p className="text-muted-foreground mb-10">
          Seu refúgio de calma, clareza e bem-estar.
        </p>

        {/* Auth Switch */}
        <AuthSwitch onNewUser={handleNewUser} onExistingUser={handleExistingUser} />
      </div>
    </div>
  );

  // Login Screen
  const LoginScreen = () => (
    <div className="min-h-screen bg-card flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">T</span>
            <span className="text-lg font-bold text-accent">+</span>
          </div>
        </div>
        
        <LoginForm onLogin={handleLogin} onBack={handleBackToChoose} />
      </div>
    </div>
  );

  // Show auth choose screen first
  if (authMode === 'choose') {
    return <AuthChooseScreen />;
  }

  // Show login screen
  if (authMode === 'login') {
    return <LoginScreen />;
  }

  const questions = [
    {
      title: "Como você gostaria de ser chamado?",
      subtitle: <>Para tornarmos sua experiência <span className="text-accent">+</span> pessoal.</>,
      content: (
        <div className="mt-6 w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome ou apelido"
            className="w-full p-4 text-center text-xl bg-secondary border-b-2 border-border focus:border-primary outline-none transition-colors rounded-t-lg text-foreground placeholder-muted-foreground"
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
          className="mt-4 p-4 border border-border rounded-xl w-full h-32 focus:ring-2 focus:ring-primary outline-none resize-none bg-secondary text-foreground placeholder-muted-foreground"
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

  const currentQuestion = questions[step - 1]; // Adjusted since step 0 is now auth choose
  const isButtonDisabled = (step === 1 && !name) || (step === 3 && !path);

  // If step is 0 (shouldn't happen in 'new' mode, but just in case)
  if (step === 0 || !currentQuestion) {
    return <AuthChooseScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className={`w-full max-w-md text-center transition-opacity duration-200 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Indicator - At the top */}
        <ProgressIndicator
          currentStep={step}
          totalSteps={questions.length}
          onContinue={handleNext}
          onBack={() => {
            if (step === 1) {
              handleBackToChoose();
            } else {
              setStep(step - 1);
              playSound('select');
            }
          }}
          isExpanded={step === 1}
          continueDisabled={isButtonDisabled}
          continueText={currentQuestion.buttonText}
        />

        {/* Content */}
        <h1 className="text-2xl font-bold text-foreground mb-2 mt-6">{currentQuestion.title}</h1>
        <p className="text-muted-foreground mb-4">{currentQuestion.subtitle}</p>
        
        {currentQuestion.content}
      </div>
    </div>
  );
};

export default OnboardingScreen;
