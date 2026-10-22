import { writeFile } from "node:fs/promises";
import { loadConfig } from "./lib/config.ts";
import { summary } from "./lib/summary.ts";
import { panic } from "./lib/utils.ts";
import {
    createUseWorkfile,
    cleanWorkfile,
    getRunningWork,
    resolveWorkfilePath,
} from "./lib/workfile.ts";
import { openWorkfileForEdit } from "./lib/edit.ts";

const config = await loadConfig();
const WORKFILE_PATH = await resolveWorkfilePath({
    local: config.localWorkfile,
});
const useWorkfile = createUseWorkfile(WORKFILE_PATH);

async function startWork() {
    const workfileContent = await useWorkfile();
    const runningWork = getRunningWork(workfileContent);
    if (runningWork) {
        panic("Work already running, won't start it");
    }

    const datetime = new Date();
    const timestamp = `start ${datetime.toISOString()}\n`;

    const newContent = workfileContent.concat(timestamp);

    await writeFile(WORKFILE_PATH, newContent, {
        encoding: "utf-8",
    });
}

async function endWork() {
    const workfileContent = await useWorkfile();
    const runningWork = getRunningWork(workfileContent);
    if (!runningWork) {
        panic("No work running, won't end it");
    }

    const datetime = new Date();
    const timestamp = `end   ${datetime.toISOString()}\n`;

    const newContent = workfileContent.concat(timestamp);
    await writeFile(WORKFILE_PATH, newContent, {
        encoding: "utf-8",
    });
}

async function run(command: string) {
    switch (command) {
        case "start":
            await startWork();
            break;
        case "end":
            await endWork();
            // after we end work, print the summary
            // TODO add option to opt-out
            await summary(WORKFILE_PATH, config.summary);
            break;
        case "clean":
            await cleanWorkfile(WORKFILE_PATH);
            break;
        case "summary":
        case "status":
            await summary(WORKFILE_PATH, config.summary);
            break;
        case "edit":
            openWorkfileForEdit(WORKFILE_PATH);
            await summary(WORKFILE_PATH, config.summary);
            break;
        default:
            panic(`Unknown command: ${command}`);
    }
}

if (process.argv.length < 3) {
    panic("Provide a command");
}
await run(process.argv[2]);
