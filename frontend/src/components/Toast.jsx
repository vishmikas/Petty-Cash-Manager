import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';


const Toast = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 3000 
}) => {

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-500',
          text: 'text-emerald-800',
          icon: <CheckCircle className="w-5 h-5 text-emerald-500 
            flex-shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-500',
          text: 'text-rose-800',
          icon: <AlertCircle className="w-5 h-5 text-rose-500 
            flex-shrink-0" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500 
            flex-shrink-0" />
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`
        flex items-center gap-3 
        ${styles.bg} ${styles.text}
        px-4 py-3 rounded-lg shadow-lg 
        border-l-4 ${styles.border}
        min-w-[300px] max-w-md
      `}>
        {styles.icon}
        <p className="flex-1 font-medium text-sm">{message}</p>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;