import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Button } from './ui';

const config = {
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  error: { icon: AlertCircle, className: 'border-rose-200 bg-rose-50 text-rose-900' },
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-900' }
};

function Toast({ message, type = 'success', onClose }) {
  const item = config[type] || config.info;
  const Icon = item.icon;

  useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed right-4 top-20 z-50 w-[calc(100%-2rem)] max-w-sm animate-slide-in">
      <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-soft backdrop-blur ${item.className}`}>
        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium leading-5">{message}</p>
        <Button variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default Toast;
