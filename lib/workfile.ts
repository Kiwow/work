import { resolve, dirname, join } from "node:path";
import { homedir } from "node:os";
import {
    access,
    constants,
    readFile,
    unlink,
    writeFile,
} from "node:fs/promises";
import { panic } from "./utils.ts";

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
        try {
            const file = await readFile(path, {
                encoding: "utf-8",
            });
            return file;
        } catch {}

        const parentPath = join(dirname(path), "..", ".workfile");
        if (parentPath === path) {
            break;
        }
        path = parentPath;
    }

    console.log(
        `No local workfile found, falling back to home directory: ${home}`,
    );
    return join(home, ".workfile");
}

export async function readWorkfile(path: string): Promise<string> {
    return await readFile(path, {
        encoding: "utf-8",
    });
}

async function createWorkfile(path: string, { log = false }): Promise<void> {
    if (log) {
        console.log(`Creating workfile at ${path}...`);
    }
    await writeFile(path, "", {
        encoding: "utf-8",
    });
}

async function getWorkfileOrCreate(workfilePath: string): Promise<string> {
    let workfileContents = "";
    try {
        workfileContents = await readWorkfile(workfilePath);
    } catch {
        await createWorkfile(workfilePath, { log: true });
    }

    return workfileContents;
}

export async function getWorkfileIfExists(
    workfilePath: string,
): Promise<
    { exists: true; content: string } | { exists: false; content: null }
> {
    try {
        const workfileContents = await readWorkfile(workfilePath);
        return {
            exists: true,
            content: workfileContents,
        };
    } catch {
        return {
            exists: false,
            content: null,
        };
    }
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

export async function cleanWorkfile(workfilePath: string): Promise<void> {
    try {
        await access(workfilePath, constants.F_OK);

        await unlink(workfilePath);
        // overwrite the current workfile with an empty one
        // if we simply delete the file then cleaning breaks local workfiles
        await createWorkfile(workfilePath, { log: true });
    } catch {
        console.log("No workfile present, nothing to clean");
    }
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
