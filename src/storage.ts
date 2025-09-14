export function setLocalStorageItem(key: string, value: any): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalStorageItem<T>(key: string): T | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
}


export function removeLocalStorageItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(key);
}