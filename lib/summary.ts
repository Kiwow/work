import { toDateTimeString, toTimeString } from "./datetime";
import { type RoundingMode, roundInterval } from "./rounding";
import { chunkBy, Interval, panic, zip } from "./utils";
import {
    datetimeFromWorkfileLine,
    getRunningWork,
    getWorkfileIfExists,
} from "./workfile";

export type SummaryOptions = {
    locale: string;
    separator: string;
    roundingMode: RoundingMode;
};

export function getSummary(
    workfileLines: string[],
    options: SummaryOptions,
): string {
    const { locale, separator, roundingMode } = options;

    const dates = workfileLines.map(datetimeFromWorkfileLine);

    if (dates.length === 1) {
        panic("Empty workfile, no summary to be shown");
    }

    const intervals = chunkBy(dates, 2).map((interval) =>
        roundInterval(interval, roundingMode),
    );
    const lengths = intervals.map(([from, to]) =>
        new Interval(from, to).toString(),
    );
    return zip(intervals, lengths)
        .map(([[from, to], length]) => {
            const fromStr =
                locale === "cs-CZ"
                    ? toDateTimeString(from)
                    : from.toLocaleString(locale);

            if (from.getDate() === to.getDate()) {
                return fromStr.concat(
                    separator,
                    locale === "cs-CZ"
                        ? toTimeString(to)
                        : to.toLocaleString(locale),
                    separator,
                    `(${length})`,
                );
            }

            const toStr =
                locale === "cs-CZ"
                    ? toDateTimeString(from)
                    : to.toLocaleString(locale);
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
        const runningStart = datetimeFromWorkfileLine(lastLine);
        console.log(
            `\nWork running, started at ${options.locale === "cs-CZ" ? toDateTimeString(runningStart) : runningStart.toLocaleString(options.locale)}`,
        );
        return;
    }

    const summary = getSummary(workfileLines, options);
    console.log(summary);
}
