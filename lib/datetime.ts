function pad(s: string | number): string {
    return s.toString().padStart(2, "0");
}

export function toDateString(date: Date): string {
    return `${pad(date.getDate())}. ${pad(date.getMonth() + 1)}. ${date.getFullYear()}`;
}

export function toTimeString(date: Date): string {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDateTimeString(date: Date): string {
    return `${toDateString(date)} ${toTimeString(date)}`;
}
