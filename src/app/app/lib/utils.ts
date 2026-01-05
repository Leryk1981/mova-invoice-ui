export const downloadJson = (filename: string, payload: unknown) => {
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const formatCurrency = (amount?: number) => {
  if (amount === undefined || Number.isNaN(amount)) {
    return "-";
  }
  return `${amount.toFixed(2)} EUR`;
};
