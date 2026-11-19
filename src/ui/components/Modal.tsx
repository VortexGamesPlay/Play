import { useEffect, type ReactNode } from 'react';
import { Icon } from '../art/Icons';
import { useUi } from '../../store/uiStore';

export function Modal({ title, children, width, onClose, icon }: { title?: ReactNode; children: ReactNode; width?: number; onClose?: () => void; icon?: ReactNode }) {
  const close = onClose ?? useUi.getState().closeModal;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal" role="dialog" aria-modal="true" style={width ? { ['--w' as string]: `${width}px` } : undefined}>
        {title !== undefined && (
          <div className="modal-head">
            {icon}
            <h2>{title}</h2>
            <button className="icon-btn modal-close" onClick={close} aria-label="Fermer"><Icon name="close" /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
