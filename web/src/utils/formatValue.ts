const formatValue = (value: number): string =>
  Intl.NumberFormat('pr-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value); // TODO

export default formatValue;
