import { useEffect } from 'react';
import { ToastMsg } from '@/types';

interface ToastProps {
  msg: ToastMsg;
  onDone: () => void;
}

export default function Toast({ msg, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="toast">
      <div className={`toast-icon toast-${msg.type}`}>
        {msg.type === 'success' ? '✓' : msg.type === 'error' ? '✕' : 'i'}
      </div>
      <div>
        <div className="toast-title">{msg.title}</div>
        {msg.desc && <div className="toast-desc">{msg.desc}</div>}
      </div>
    </div>
  );
}
