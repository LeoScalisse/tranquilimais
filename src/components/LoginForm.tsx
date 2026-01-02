import React, { useState } from 'react';
import { playSound } from '../services/soundService';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onBack: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha todos os campos');
      playSound('error');
      return;
    }
    if (!email.includes('@')) {
      setError('Email inválido');
      playSound('error');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      playSound('error');
      return;
    }
    playSound('confirm');
    onLogin(email, password);
  };

  return (
    <div className="w-full max-w-sm mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Bem-vindo de volta!</h2>
      <p className="text-muted-foreground text-center mb-6">Entre com sua conta para continuar</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="seu@email.com"
            className="w-full p-4 rounded-xl bg-secondary border-2 border-border focus:border-primary outline-none transition-colors text-foreground placeholder-muted-foreground"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="••••••••"
            className="w-full p-4 rounded-xl bg-secondary border-2 border-border focus:border-primary outline-none transition-colors text-foreground placeholder-muted-foreground"
          />
        </div>

        {error && (
          <p className="text-destructive text-sm text-center animate-fade-in">{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:opacity-90"
        >
          Entrar
        </button>
      </form>

      <button
        onClick={() => {
          playSound('select');
          onBack();
        }}
        className="mt-4 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Voltar
      </button>
    </div>
  );
};

export default LoginForm;
