import { chunkBy, panic, zip } from "./utils";
import {
    datetimeFromWorkfileLine,
    getRunningWork,
    getWorkfileIfExists,
} from "./workfile";

type TimeUnit = "minute" | "second";

function dateDiff(from: Date, to: Date, unit: TimeUnit = "minute") {
    const millis = Number(to) - Number(from);
    let duration: number;
    if (unit === "second") {
        duration = Math.round(millis / 1000);
    } else {
        // minutes by default
        duration = Math.round(millis / (1000 * 60));
    }

    return `${duration} ${duration === 1 ? unit : unit.concat("s")}`;
}

export type SummaryOptions = {
    locale: string;
    unit: TimeUnit;
    separator: string;
};

export function logSummary(
    workfileContent: string,
    options: SummaryOptions
): void {
    const { locale, unit, separator } = options;

    const dates = workfileContent
        .trimEnd()
        .split("\n")
        .map(datetimeFromWorkfileLine);

    if (dates.length === 1) {
        panic("Empty workfile, no summary to be shown");
    }

    const intervals = chunkBy(dates, 2);
    const lengths = intervals.map(([from, to]) => dateDiff(from, to, unit));
    const summary = zip(intervals, lengths)
        .map(([[from, to], length]) => {
            const fromStr = from.toLocaleString(locale);
            const toStr = to.toLocaleString(locale);
            return fromStr.concat(separator, toStr, separator, `(${length})`);
        })
        .join("\n");

    console.log(summary);
}

export async function summary(
    workfilePath: string,
    options: SummaryOptions
): Promise<void> {
    const { content: workfileContent, exists: workfileExists } =
        await getWorkfileIfExists(workfilePath);
    if (!workfileExists) {
        panic("No workfile available");
    }

    const runningWork = getRunningWork(workfileContent);
    if (runningWork) {
        panic("Work still running, please end it before running summary");
    }

    logSummary(workfileContent, options);
}
