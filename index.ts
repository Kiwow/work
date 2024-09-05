import { loadConfig } from "./lib/config";
import { summary } from "./lib/summary";
import { panic } from "./lib/utils";
import {
    createUseWorkfile,
    datetimeFromWorkfileLine,
    deleteWorkfile,
    resolveWorkfilePath,
} from "./lib/workfile";

const config = await loadConfig();
const WORK_FILE = resolveWorkfilePath({ local: config.localWorkfile });
const useWorkfile = createUseWorkfile(WORK_FILE);

export async function getRunningWork(): Promise<Date | null> {
    const workfileContent = await useWorkfile();
    const lastLine = workfileContent.trim().split("\n").at(-1);
    if (!lastLine || lastLine.startsWith("end")) {
        return null;
    }

    if (!lastLine.startsWith("start")) {
        panic(
            `Last line corrupted in workfile. file contents:\n${workfileContent}`
        );
    }

    // start xxx
    // 0123456
    return datetimeFromWorkfileLine(lastLine);
}

async function startWork() {
    const runningWork = await getRunningWork();
    if (runningWork) {
        panic("Work already running, won't start it");
    }

    const datetime = new Date();
    const timestamp = `start ${datetime.toISOString()}\n`;

    const workfileContent = await useWorkfile();
    const newContent = workfileContent.concat(timestamp);

    await Bun.write(WORK_FILE, newContent);
}

async function endWork() {
    const runningWork = await getRunningWork();
    if (!runningWork) {
        panic("No work running, won't end it");
    }

    const datetime = new Date();
    const timestamp = `end   ${datetime.toISOString()}\n`;

    const workfileContent = await useWorkfile();
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
            const runningWork = await getRunningWork();
            if (runningWork) {
                console.log(
                    "Work still running, please end it before running summary"
                );
                break;
            }
            const workfileContent = await useWorkfile();
            await summary(workfileContent, {
                locale: config.summary.locale,
                unit: config.summary.unit,
                separator: config.summary.separator,
            });
            break;
        default:
            panic(`Unknown command: ${command}`);
    }
}

if (process.argv.length < 3) {
    panic("Provide a command");
}
await run(process.argv[2]);
