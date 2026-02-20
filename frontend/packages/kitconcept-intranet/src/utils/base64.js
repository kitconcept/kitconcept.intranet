export const toBase64Unicode = (value) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)));

export const toBase64Latin1 = (value) => btoa(value);
