import { useUi } from '../../store/uiStore';
import { tr } from '../../i18n';

export function ConfirmModal({ body, confirmLabel, danger, onConfirm }: { body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void }) {
  const close = useUi.getState().closeModal;
  return (
    <div className="stack">
      <p className="soft">{body}</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={close}>{tr('Annuler')}</button>
        <button className={`btn ${danger ? 'btn-danger' : ''}`} onClick={() => { close(); onConfirm(); }}>{confirmLabel}</button>
      </div>
    </div>
  );
}
