

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XCircleIcon } from '../icons/index.ts';
import Card from './Card.tsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <Card
        className="w-full max-w-md m-4 p-0"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white" aria-label="Close modal">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </Card>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;