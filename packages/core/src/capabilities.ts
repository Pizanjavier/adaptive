let caps: string[] = [];

export function setCapabilities(c: string[]): void {
  caps = c;
}

export function getCapabilities(): string[] {
  return caps;
}

export function resetCapabilities(): void {
  caps = [];
}
