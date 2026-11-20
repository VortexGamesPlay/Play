import type { CurrencyId } from '@core/types';
import { CurrencyIcon } from '../art/Icons';
import { intlLocale } from '../../i18n';

export function Price({ currency, amount }: { currency: CurrencyId; amount: number }) {
  return <span className="price num"><CurrencyIcon currency={currency} />{amount.toLocaleString(intlLocale())}</span>;
}
