import { describe, test, expect } from "bun:test";
import { chunkBy } from "../lib/utils";

const range = (end: number) => {
    const result = [];
    for (let i = 0; i < end; i++) {
        result.push(i);
    }
    return result;
};

describe("testChunkBy", () => {
    test("Expected input", () => {
        const input = range(8);
        const byOne = chunkBy(input, 1);
        const byTwo = chunkBy(input, 2);
        const byFour = chunkBy(input, 4);

        expect(byOne).toEqual([[0], [1], [2], [3], [4], [5], [6], [7]]);
        expect(byTwo).toEqual([
            [0, 1],
            [2, 3],
            [4, 5],
            [6, 7],
        ]);
        expect(byFour).toEqual([
            [0, 1, 2, 3],
            [4, 5, 6, 7],
        ]);
    });

    test("Empty array", () => {
        const empty: unknown[] = [];
        expect(chunkBy(empty, 1)).toEqual([]);
        expect(chunkBy(empty, 2)).toEqual([]);
        expect(chunkBy(empty, 3)).toEqual([]);
    });

    test("Uneven length", () => {
        const input = range(4);
        expect(() => chunkBy(input, 3)).toThrow();
    });

    test("By zero", () => {
        const input = range(5);
        expect(() => chunkBy(input, 0)).toThrow();
    });
});
