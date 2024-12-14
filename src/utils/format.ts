const currencyFormatter = new Intl.NumberFormat('fr', { style: 'currency', currency: 'EUR',  minimumFractionDigits: 2 });
export const eur = (value?: string | number) => {
  if (value === undefined) return '';
  return currencyFormatter.format(value as number);
}
