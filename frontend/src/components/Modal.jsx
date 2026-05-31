import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-mobile lg:max-w-lg bg-white rounded-t-3xl lg:rounded-3xl shadow-modal max-h-[92vh] flex flex-col animate-slide-up lg:animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 flex-shrink-0">
          <h3 className="text-lg font-bold text-black">{title}</h3>
          <button
            onClick={onClose}
            className="icon-btn bg-app-bg text-gray-500 hover:bg-gray-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
