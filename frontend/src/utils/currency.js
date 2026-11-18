
export const formatCurrency = (amount) => {
  const value = Number(amount ?? 0);

  return (
    new Intl.NumberFormat("km-KH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " ៛"
  );
};

export const parseCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round(number);
};
