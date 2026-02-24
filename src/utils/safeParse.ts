export const safeParse = (val: any) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};