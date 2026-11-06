import { toDateString, toDateTimeString, toTimeString } from "./datetime.ts";
import {
    intervalToTemporalDuration,
    type RoundingMode,
    roundInterval,
} from "./rounding.ts";
import { chunkBy, Interval, panic, zip } from "./utils.ts";
import {
    datetimeFromWorkfileLine,
    getRunningWork,
    getWorkfileIfExists,
} from "./workfile.ts";

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
                    ? toDateTimeString(to)
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
    const metaSummary = getMetaSummary(workfileLines, options);
    console.log(summary.concat("\n\n", metaSummary));
}

function getMetaSummary(
    workfileLines: string[],
    { roundingMode, locale }: Pick<SummaryOptions, "roundingMode" | "locale">,
) {
    const dates = workfileLines.map(datetimeFromWorkfileLine);

    if (dates.length === 1) {
        panic("Empty workfile, no summary to be shown");
    }

    const intervals = chunkBy(dates, 2).map((interval) =>
        roundInterval(interval, roundingMode),
    );

    const groupsByDay = Map.groupBy(intervals, (interval) =>
        new Date(interval[1]).toDateString(),
    );

    let formatted = "";
    for (const intervals of groupsByDay.values()) {
        const totalMillis = intervals.reduce(
            (acc, interval) =>
                acc + (interval[1].getTime() - interval[0].getTime()),
            0,
        );
        const totalDuration = new Interval(totalMillis);

        // Map.groupBy never produces empty groups
        const dayEnd = intervals[0]![1];
        const formattedDay =
            locale === "cs-CZ"
                ? toDateString(dayEnd)
                : dayEnd.toLocaleString(locale);

        formatted += `On ${formattedDay}, ${totalDuration} in total\n`;
    }

    formatted += "\n";

    const groupsByMonth = Map.groupBy(intervals, (interval) => {
        const endDate = instantToPraguePlainDate(
            interval[1].toTemporalInstant(),
        );
        return endDate.monthCode;
    });

    for (const month of groupsByMonth.values()) {
        const dayInMonth = instantToPraguePlainDate(
            month[0]![0].toTemporalInstant(),
        );
        const monthName = dayInMonth.toLocaleString("en-GB", {
            month: "long",
        });

        const monthTotal = month
            .values()
            .map((interval) => intervalToTemporalDuration(interval))
            .reduce((acc, x) => acc.add(x))
            .round({ largestUnit: "hour", smallestUnit: "minute" })
            .toLocaleString("en-GB", { style: "long" });

        formatted += `In ${`${monthName},`.padEnd(10)} ${monthTotal} total\n`;
    }

    return formatted;
}

function instantToPraguePlainDate(instant: Temporal.Instant) {
    return new Temporal.ZonedDateTime(
        instant.epochNanoseconds,
        "Europe/Prague",
    ).toPlainDate();
}
