import { homedir } from "node:os";
import { resolve, join } from "node:path";
import type { SummaryOptions } from "./summary.ts";
import { readFile } from "node:fs/promises";

const CONFIG_PATH = join(".config", "work.json");

type WorkConfig = {
    localWorkfile: boolean;
    summary: SummaryOptions;
};

const defaultWorkConfig = (): WorkConfig => ({
    localWorkfile: false,
    summary: {
        separator: " | ",
        locale: "cs-CZ",
        roundingMode: "none",
    },
});

function getConfigFile(configPath: string): Promise<Record<string, unknown>> {
    return (readJson(configPath) as Promise<Record<string, unknown>>).catch(
        (err: unknown) => {
            if (err instanceof SyntaxError) {
                console.error("Failed to read config, using defaults");
            }
            // no config found, use default
            return {};
        },
    );
}

export async function loadConfig(): Promise<WorkConfig> {
    const configPath = resolve(homedir(), CONFIG_PATH);
    const parsedConfig = await getConfigFile(configPath);
    const config = defaultWorkConfig();

    if (
        parsedConfig["localWorkfile"] &&
        typeof parsedConfig["localWorkfile"] === "boolean"
    ) {
        config.localWorkfile = parsedConfig["localWorkfile"];
    }

    // we have zod at home
    // TODO: add zod?
    if (parsedConfig["summary"]) {
        config.summary = { ...config.summary, ...parsedConfig["summary"] };
    }

    return config;
}

async function readJson(path: string): Promise<unknown> {
    const fileContents = await readFile(path, {
        encoding: "utf-8",
    });
    return JSON.parse(fileContents);
}
