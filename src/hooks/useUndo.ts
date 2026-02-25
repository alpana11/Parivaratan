import { useState, useCallback } from 'react';

interface UndoAction {
  action: () => Promise<void>;
  message: string;
}

export const useUndo = () => {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [isUndoVisible, setIsUndoVisible] = useState(false);

  const showUndo = useCallback((action: () => Promise<void>, message: string) => {
    setUndoAction({ action, message });
    setIsUndoVisible(true);
  }, []);

  const executeUndo = useCallback(async () => {
    if (undoAction) {
      await undoAction.action();
      setIsUndoVisible(false);
      setUndoAction(null);
    }
  }, [undoAction]);

  const dismissUndo = useCallback(() => {
    setIsUndoVisible(false);
    setUndoAction(null);
  }, []);

  return {
    undoAction,
    isUndoVisible,
    undoMessage: undoAction?.message || '',
    showUndo,
    executeUndo,
    dismissUndo
  };
};
