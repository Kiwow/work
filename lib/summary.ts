import { type RoundingMode, roundInterval } from "./rounding";
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
    roundingMode: RoundingMode;
};

export function getSummary(
    workfileLines: string[],
    options: SummaryOptions,
): string {
    const { locale, unit, separator, roundingMode } = options;

    const dates = workfileLines.map(datetimeFromWorkfileLine);

    if (dates.length === 1) {
        panic("Empty workfile, no summary to be shown");
    }

    const intervals = chunkBy(dates, 2).map((interval) =>
        roundInterval(interval, roundingMode),
    );
    const lengths = intervals.map(([from, to]) => dateDiff(from, to, unit));
    return zip(intervals, lengths)
        .map(([[from, to], length]) => {
            const fromStr = from.toLocaleString(locale);
            const toStr = to.toLocaleString(locale);
            return fromStr.concat(separator, toStr, separator, `(${length})`);
        })
        .join("\n");
}

export async function summary(
    workfilePath: string,
    options: SummaryOptions,
): Promise<void> {
    const { content: workfileContent, exists: workfileExists } =
        await getWorkfileIfExists(workfilePath);
    if (!workfileExists) {
        panic("No workfile available");
    }

    const runningWork = getRunningWork(workfileContent);

    const workfileLines = workfileContent.trimEnd().split("\n");

    if (runningWork) {
        const lastLine = workfileLines.at(-1);
        if (lastLine === undefined) {
            panic("Work is running and failed to get workfile last line (???)");
        }
        const summaryExceptEnd = getSummary(
            workfileLines.slice(0, -1),
            options,
        );
        console.log(summaryExceptEnd);
        console.log(
            `\nWork running, started at ${datetimeFromWorkfileLine(lastLine).toLocaleString(options.locale)}`,
        );
        return;
    }

    const summary = getSummary(workfileLines, options);
    console.log(summary);
}
