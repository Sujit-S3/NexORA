import { formatCurrency } from './formatCurrency';

export const formatPrice = (price, currency = 'INR') => {
  return formatCurrency(price, currency);
};
