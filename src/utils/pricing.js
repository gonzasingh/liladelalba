// A partir de esta cantidad de un mismo producto se aplica el precio "x10 U." de la lista.
export const BULK_MIN_QUANTITY = 10;

export const unitPriceFor = (product, quantity) =>
  product.priceX10 != null && quantity >= BULK_MIN_QUANTITY ? product.priceX10 : product.price;
