export const formatTimestampToDate = (timestamp) =>
  new Date(timestamp * 1000).toISOString().split("T")[0];

// parse again to float to return a number instead of a string
export const floatToFixed = (f) => parseFloat(f.toFixed(2));

export const formatGrade = (grade) => floatToFixed(grade);
