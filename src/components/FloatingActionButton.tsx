import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FABAction {
  icon: string;
  label: string;
  onClick: () => void;
  color: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ actions }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end space-y-3">
      {/* Action buttons */}
      {open && (
        <div className="flex flex-col items-end space-y-3 mb-2">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                {action.label}
              </span>
              <button
                onClick={() => { action.onClick(); setOpen(false); }}
                className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white text-xl transition-all duration-200 hover:scale-110 ${action.color}`}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl transition-all duration-300 hover:scale-110 bg-gradient-to-r from-emerald-500 to-blue-500 ${open ? 'rotate-45' : ''}`}
      >
        +
      </button>
    </div>
  );
};

export default FloatingActionButton;
