import { test, expect, describe } from "bun:test";
import { round, type RoundingMode } from "../lib/rounding";

const basicOptions = (roundingMode: RoundingMode) =>
    ({
        roundingMode,
        isStart: false,
    }) as const;

describe("Basic datetime", () => {
    const datetime = new Date("2024-09-23T09:39:57.181Z");

    test("Floor", () => {
        const floored = round(datetime, basicOptions("floor"));
        const flooredStr = floored.toISOString();
        expect(flooredStr).toBe("2024-09-23T09:35:00.000Z");
    });

    test("Ceil", () => {
        const ceiled = round(datetime, basicOptions("ceil"));
        const ceiledStr = ceiled.toISOString();

        expect(ceiledStr).toBe("2024-09-23T09:40:00.000Z");
    });

    test("Closest", () => {
        const rounded = round(datetime, basicOptions("closest"));
        const roundedStr = rounded.toISOString();

        expect(roundedStr).toBe("2024-09-23T09:40:00.000Z");
    });

    test("Expand", () => {
        const roundedAsStart = round(datetime, {
            roundingMode: "expand",
            isStart: true,
        });
        const roundedAsEnd = round(datetime, {
            roundingMode: "expand",
            isStart: false,
        });

        expect(roundedAsStart.toISOString()).toBe("2024-09-23T09:35:00.000Z");
        expect(roundedAsEnd.toISOString()).toBe("2024-09-23T09:40:00.000Z");
    });
});

describe("Whole time", () => {
    const datetime = new Date("2024-09-23T09:00:00.000Z");
    const expectedResult = datetime.toISOString();

    test("Floor", () => {
        const floored = round(datetime, basicOptions("floor"));
        const flooredStr = floored.toISOString();

        expect(flooredStr).toBe(expectedResult);
    });

    test("Ceil", () => {
        const ceiled = round(datetime, basicOptions("ceil"));
        const ceiledStr = ceiled.toISOString();

        expect(ceiledStr).toBe(expectedResult);
    });

    test("Closest", () => {
        const rounded = round(datetime, basicOptions("closest"));
        const roundedStr = rounded.toISOString();

        expect(roundedStr).toBe(expectedResult);
    });

    test("Expand", () => {
        const roundedAsStart = round(datetime, {
            roundingMode: "expand",
            isStart: true,
        });
        const roundedAsEnd = round(datetime, {
            roundingMode: "expand",
            isStart: false,
        });

        expect(roundedAsStart.toISOString()).toBe(expectedResult);
        expect(roundedAsEnd.toISOString()).toBe(expectedResult);
    });
});
