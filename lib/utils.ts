// https://stackoverflow.com/a/52490977
type Tuple<T, N extends number> = N extends N
    ? number extends N
        ? T[]
        : _TupleOf<T, N, []>
    : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
    ? R
    : _TupleOf<T, N, [T, ...R]>;

/**
 * Turns an array into groups of a set size.
 *
 * If the array is not evenly divisible, throws an exception
 * @param arr array to split
 * @param chunkSize size of one chunk
 * @returns array of chunks of set size
 * @throws when the array is not evenly divisible into chunks of set size
 * @throws when chunkSize is zero
 */
export function chunkBy<T, ChunkSize extends number>(
    arr: Array<T>,
    chunkSize: ChunkSize,
): Array<Tuple<T, ChunkSize>> {
    if (chunkSize === 0) {
        throw new Error("chunkSize cannot be zero");
    }
    if (arr.length % chunkSize !== 0) {
        throw new Error(
            `chunkBy: array of length ${arr.length} cannot be evenly chunked by ${chunkSize} items`,
        );
    }

    const chunks: Array<Tuple<T, ChunkSize>> = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = new Array(chunkSize) as Tuple<T, ChunkSize>;
        for (let j = 0; j < chunkSize; j++) {
            chunk[j] = arr[i + j];
        }
        chunks.push(chunk);
    }
    return chunks;
}

/**
 * Zips together two arrays
 *
 * When the arrays have different lengths,
 * prints a warning and omits extra elements of the longer one
 * @returns an array of tuples, each containing one item from one array
 * and the other from the other array
 */
export function zip<T, U>(one: Array<T>, other: Array<U>): Array<[T, U]> {
    if (one.length !== other.length) {
        console.warn("Zipping arrays of different lengths");
    }

    const zipped: Array<[T, U]> = [];
    for (let i = 0; i < Math.min(one.length, other.length); i++) {
        zipped.push([one[i], other[i]]);
    }
    return zipped;
}

export function panic(message: string, exitCode = 1): never {
    console.error(message);
    process.exit(exitCode);
}

export class Interval {
    private days: number;
    private hours: number;
    private minutes: number;

    constructor(start: Date, end: Date) {
        let millisDiff = Number(end) - Number(start);
        [this.days, millisDiff] = Interval.millisToDays(millisDiff);
        [this.hours, millisDiff] = Interval.millisToHours(millisDiff);
        [this.minutes, millisDiff] = Interval.millisToMinutes(millisDiff);
    }

    private static formatNumberWithUnit(
        value: number,
        unitName: string,
    ): string {
        return `${value} ${value === 1 ? unitName : unitName.concat("s")}`;
    }

    toString(): string {
        return (
            [
                [this.days, "day"],
                [this.hours, "hour"],
                [this.minutes, "minute"],
            ] as const
        )
            .filter(([value, _]) => value !== 0)
            .flatMap(([value, unitName]) =>
                Interval.formatNumberWithUnit(value, unitName),
            )
            .join(" ");
    }

    private static millisToDays(millisDiff: number): [number, number] {
        const millisecondsInDay = 24 * 60 * 60 * 1000;
        const dayDiff = Math.floor(millisDiff / millisecondsInDay);
        const restOfMillis = millisDiff % millisecondsInDay;
        return [dayDiff, restOfMillis];
    }

    private static millisToHours(millisDiff: number): [number, number] {
        const millisecondsInHour = 60 * 60 * 1000;
        const hourDiff = Math.floor(millisDiff / millisecondsInHour);
        const restOfMillis = millisDiff % millisecondsInHour;
        return [hourDiff, restOfMillis];
    }

    private static millisToMinutes(millisDiff: number): [number, number] {
        const millisecondsInMinute = 60 * 1000;
        const minuteDiff = Math.floor(millisDiff / millisecondsInMinute);
        const restOfMillis = millisDiff % millisecondsInMinute;
        return [minuteDiff, restOfMillis];
    }
}
