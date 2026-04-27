export function money(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
