import React, { useEffect } from 'react';

interface UndoNotificationProps {
  isVisible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

const UndoNotification: React.FC<UndoNotificationProps> = ({
  isVisible,
  message,
  onUndo,
  onDismiss,
  duration = 5000
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 flex items-center space-x-4 max-w-md">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onUndo}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm font-medium transition-colors"
        >
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default UndoNotification;
