import type { BunFile } from "bun";
import { unlink } from "node:fs/promises";

async function readWorkfile(path: string): Promise<BunFile> {
    return Bun.file(path, {
        type: "text/plain;charset=utf-8",
    });
}

async function createWorkfile(path: string): Promise<void> {
    console.log(`Creating workfile at ${path}...`);
    await Bun.write(path, "");
}

async function getWorkfileContent(path: string): Promise<string> {
    const workfile = await readWorkfile(path);
    const workfileExists = await workfile.exists();

    if (!workfileExists) {
        await createWorkfile(path);
    }

    return await workfile.text();
}

export function createUseWorkfile(path: string): () => Promise<string> {
    let workfileContent: string | null = null;
    return async (): Promise<string> => {
        if (workfileContent === null) {
            workfileContent = await getWorkfileContent(path);
        }
        return workfileContent;
    };
}

export async function deleteWorkfile(path: string): Promise<void> {
    const workfile = await readWorkfile(path);
    const workfileExists = await workfile.exists();
    if (!workfileExists) {
        console.log("No workfile present, nothing to clean");
        return;
    }

    // https://bun.sh/guides/write-file/unlink
    await unlink(path);
}
