import { chunkBy, zip } from "./utils";
import { datetimeFromWorkfileLine } from "./workfile";

type TimeUnit = "minute" | "second";

function dateDiff(from: Date, to: Date, unit: TimeUnit = "minute") {
    const millis = Number(to) - Number(from);
    let duration: number;
    if (unit === "minute") {
        duration = Math.round(millis / (1000 * 60));
    } else if (unit === "second") {
        duration = Math.round(millis / 1000);
    } else {
        throw new Error(`Unknown unit: ${unit}`);
    }

    return `${duration} ${duration === 1 ? unit : unit.concat("s")}`;
}

type SummaryOptions = {
    locale: string;
    unit: TimeUnit;
};

export async function summary(
    workfileContent: string,
    options: Partial<SummaryOptions> = {}
): Promise<void> {
    const { locale = "cs-CZ", unit = "minute" } = options;

    const dates = workfileContent
        .trimEnd()
        .split("\n")
        .map(datetimeFromWorkfileLine);

    if (dates.length === 1) {
        // empty workfile
        console.log("Empty workfile, no summary to be shown");
        return;
    }

    const intervals = chunkBy(dates, 2);
    const lengths = intervals.map(([from, to]) => dateDiff(from, to, unit));
    const separator = " | ";

    const summary = zip(intervals, lengths)
        .map(([[from, to], length]) => {
            const fromStr = from.toLocaleString(locale);
            const toStr = to.toLocaleString(locale);
            return fromStr.concat(separator, toStr, separator, `(${length})`);
        })
        .join("\n");
    console.log(summary);
}
