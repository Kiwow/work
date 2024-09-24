import { resolve } from "node:path";
import { homedir } from "node:os";
import type { BunFile } from "bun";
import { unlink } from "node:fs/promises";
import { panic } from "./utils";

type ResolveWorkfilePathOptions = {
    local: boolean;
};

export function resolveWorkfilePath(
    options: Partial<ResolveWorkfilePathOptions> = {},
): string {
    const { local = false } = options;

    const workfileDirectory = local ? "." : homedir();
    return resolve(workfileDirectory, ".workfile");
}

export async function readWorkfile(path: string): Promise<BunFile> {
    return Bun.file(path, {
        type: "text/plain;charset=utf-8",
    });
}

async function createWorkfile(path: string, { log = false }): Promise<void> {
    if (log) {
        console.log(`Creating workfile at ${path}...`);
    }
    await Bun.write(path, "");
}

async function getWorkfileOrCreate(workfilePath: string): Promise<string> {
    const workfile = await readWorkfile(workfilePath);
    const workfileExists = await workfile.exists();

    if (!workfileExists) {
        await createWorkfile(workfilePath, { log: true });
    }

    return workfile.text();
}

export async function getWorkfileIfExists(
    workfilePath: string,
): Promise<
    { exists: true; content: string } | { exists: false; content: null }
> {
    const workfile = await readWorkfile(workfilePath);
    const workfileExists = await workfile.exists();
    if (workfileExists) {
        return {
            exists: true,
            content: await workfile.text(),
        };
    }

    return {
        exists: false,
        content: null,
    };
}

export function createUseWorkfile(workfilePath: string): () => Promise<string> {
    let workfileContent: string | null = null;
    return async (): Promise<string> => {
        if (workfileContent === null) {
            workfileContent = await getWorkfileOrCreate(workfilePath);
        }
        return workfileContent;
    };
}

export async function deleteWorkfile(workfilePath: string): Promise<void> {
    const workfile = await readWorkfile(workfilePath);
    const workfileExists = await workfile.exists();
    if (!workfileExists) {
        console.log("No workfile present, nothing to clean");
        return;
    }

    // https://bun.sh/guides/write-file/unlink
    await unlink(workfilePath);
}

export function datetimeFromWorkfileLine(line: string): Date {
    // start xxx
    // end   xxx
    // 0123456
    return new Date(line.slice(6));
}

export function getRunningWork(workfileContent: string): Date | null {
    const lastLine = workfileContent.trimEnd().split("\n").at(-1);
    if (!lastLine || lastLine.startsWith("end")) {
        return null;
    }

    if (!lastLine.startsWith("start")) {
        panic(
            `Last line corrupted in workfile. file contents:\n${workfileContent}`,
        );
    }

    return datetimeFromWorkfileLine(lastLine);
}
