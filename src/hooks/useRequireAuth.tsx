import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useRequireAuth = () => {
  const { user } = useAuth();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((action: () => void) => {
    if (user) {
      action();
    } else {
      setPendingAction(() => action);
      setShowSignUpDialog(true);
    }
  }, [user]);

  const onAuthSuccess = useCallback(() => {
    if (pendingAction) {
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 100);
    }
  }, [pendingAction]);

  return {
    requireAuth,
    showSignUpDialog,
    setShowSignUpDialog,
    onAuthSuccess,
    isAuthenticated: !!user
  };
};
