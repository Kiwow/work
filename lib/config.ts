import { homedir } from "node:os";
import { resolve, join } from "node:path";
import type { SummaryOptions } from "./summary";

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
        unit: "minute",
        roundingMode: "none",
    },
});

async function getConfigFile(
    configPath: string,
): Promise<Record<string, unknown>> {
    try {
        return await Bun.file(configPath).json();
    } catch (err) {
        if (err instanceof SyntaxError) {
            console.error("Failed to read config, using defaults");
        }
        // no config found, use default
        return {};
    }
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
