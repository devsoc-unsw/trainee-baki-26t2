export const normaliseName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

export const formatIngredientName = (value: string) => {
  const normalisedName = normaliseName(value);
  return normalisedName.charAt(0).toUpperCase() + normalisedName.slice(1);
};
