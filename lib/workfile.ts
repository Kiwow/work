import { resolve, dirname, join } from "node:path";
import { homedir } from "node:os";
import type { BunFile } from "bun";
import { unlink } from "node:fs/promises";
import { panic } from "./utils";

type ResolveWorkfilePathOptions = {
    local: boolean;
};

export async function resolveWorkfilePath(
    options: Partial<ResolveWorkfilePathOptions> = {},
): Promise<string> {
    const { local = false } = options;

    const workfilePath = await (local
        ? searchForWorkfile()
        : resolve(homedir(), ".workfile"));
    return workfilePath;
}

async function searchForWorkfile() {
    const home = homedir();
    let path = resolve(".workfile");

    while (dirname(path) !== home) {
        console.log(`Looking for ${path}`);
        const file = Bun.file(path);
        if (await file.exists()) {
            console.log("Exists, returning...");
            return path;
        }

        const parentPath = join(dirname(path), "..", ".workfile");
        if (parentPath === path) {
            break;
        }
        path = parentPath;
    }

    console.log(
        `No local workfile found, falling back to home directory: ${home}`,
    );
    return home;
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
        await createWorkfile(join(workfilePath, ".workfile"), { log: true });
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
