import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { playSound } from '@/services/soundService';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const SignUpDialog: React.FC<SignUpDialogProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess,
  title = "Crie sua conta",
  description = "Para continuar, crie uma conta gratuita"
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Get onboarding data from localStorage
    const storedOnboarding = localStorage.getItem('tranquili_onboarding');
    const onboardingData = storedOnboarding ? JSON.parse(storedOnboarding) : {};

    if (mode === 'signup') {
      const metadata = {
        name: name || onboardingData.name || 'Usuário',
        path: onboardingData.path || 'AUTOCUIDADO',
        reason: onboardingData.reason || ''
      };

      const { error: signUpError } = await signUp(email, password, metadata);
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else {
          setError('Erro ao criar conta. Tente novamente.');
        }
        playSound('error');
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError('Email ou senha incorretos.');
        playSound('error');
        setLoading(false);
        return;
      }
    }

    playSound('confirm');
    setLoading(false);
    onOpenChange(false);
    onSuccess?.();
  };

  const isValid = email.includes('@') && password.length >= 6 && (mode === 'login' || name.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'signup' && (
            <div>
              <Input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Seu nome"
                className="w-full"
              />
            </div>
          )}
          
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="Seu email"
              className="w-full"
            />
          </div>
          
          <div>
            <Input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder={mode === 'signup' ? "Crie uma senha (mín. 6 caracteres)" : "Sua senha"}
              className="w-full"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center animate-fade-in">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!isValid || loading}
            className="w-full"
          >
            {loading ? 'Carregando...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
            className="text-sm text-primary hover:underline"
          >
            {mode === 'signup' ? 'Já tem conta? Faça login' : 'Não tem conta? Crie uma'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpDialog;
