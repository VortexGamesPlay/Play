import { Icon, type IconName } from '../art/Icons';
import { useUi } from '../../store/uiStore';

const ICON: Record<string, IconName> = { info: 'info', success: 'check', error: 'warning', reward: 'gift' };

export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)} role="status">
          <Icon name={ICON[t.kind] ?? 'info'} />
          <div>
            <div className="t-title">{t.title}</div>
            {t.body && <div className="t-body">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
