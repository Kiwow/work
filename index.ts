import { loadConfig } from "./lib/config";
import { summary } from "./lib/summary";
import { panic } from "./lib/utils";
import {
    createUseWorkfile,
    deleteWorkfile,
    getRunningWork,
    resolveWorkfilePath,
} from "./lib/workfile";

const config = await loadConfig();
const WORK_FILE = resolveWorkfilePath({ local: config.localWorkfile });
const useWorkfile = createUseWorkfile(WORK_FILE);

async function startWork() {
    const workfileContent = await useWorkfile();
    const runningWork = getRunningWork(workfileContent);
    if (runningWork) {
        panic("Work already running, won't start it");
    }

    const datetime = new Date();
    const timestamp = `start ${datetime.toISOString()}\n`;

    const newContent = workfileContent.concat(timestamp);

    await Bun.write(WORK_FILE, newContent);
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
    await Bun.write(WORK_FILE, newContent);
}

async function run(command: string) {
    switch (command) {
        case "start":
            await startWork();
            break;
        case "end":
            await endWork();
            break;
        case "clean":
            await deleteWorkfile(WORK_FILE);
            break;
        case "summary":
            await summary(WORK_FILE, config.summary);
            break;
        default:
            panic(`Unknown command: ${command}`);
    }
}

if (process.argv.length < 3) {
    panic("Provide a command");
}
await run(process.argv[2]);
