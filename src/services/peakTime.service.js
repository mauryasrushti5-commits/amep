export const getTimeBucket = (hour) => {
  if (hour >= 5 && hour < 11) return "Morning";
  if (hour >= 11 && hour < 16) return "Afternoon";
  if (hour >= 16 && hour < 21) return "Evening";
  if (hour >= 21 || hour < 2) return "Night";
  return "Late Night";
};
