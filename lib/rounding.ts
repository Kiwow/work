import { panic } from "./utils";

export type RoundingMode = "none" | "floor" | "ceil" | "closest" | "expand";

type RoundOptions = {
    roundingMode: RoundingMode;
    isStart: boolean;
};

type Interval = [Date, Date];

export function roundInterval(
    interval: Interval,
    roundingMode: RoundingMode,
): Interval {
    return [
        round(interval[0], { roundingMode, isStart: true }),
        round(interval[1], { roundingMode, isStart: false }),
    ];
}

export function round(datetime: Date, options: RoundOptions): Date {
    const { roundingMode, isStart } = options;
    switch (roundingMode) {
        case "none":
            return datetime;
        case "floor":
            return floor(datetime);
        case "ceil":
            return ceil(datetime);
        case "closest":
            return closest(datetime);
        case "expand":
            return expand(datetime, isStart);
        default:
            panic(`Unknown rounding option: ${roundingMode}`);
    }
}

function simpleRound(
    datetime: Date,
    transform: (fiveMinutes: number) => number,
): Date {
    const millis = datetime.getTime();
    const minutes = millis / (1000 * 60);
    const roundedMinutes = transform(minutes / 5) * 5;
    return new Date(roundedMinutes * 1000 * 60);
}

const floor = (datetime: Date) => simpleRound(datetime, Math.floor);
const ceil = (datetime: Date) => simpleRound(datetime, Math.ceil);
const closest = (datetime: Date) => simpleRound(datetime, Math.round);
const expand = (datetime: Date, isStart: boolean) =>
    isStart ? floor(datetime) : ceil(datetime);
