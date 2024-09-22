import { homedir } from "node:os";
import { resolve } from "node:path";
import type { SummaryOptions } from "./summary";

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
    },
});

async function getConfigFile(
    configPath: string,
): Promise<Record<string, unknown>> {
    try {
        return await Bun.file(configPath).json();
    } catch (err) {
        if (err instanceof SyntaxError) {
            console.error(
                `Failed to read config file (using default):\n${err}`,
            );
        }
        // no config file found, use defaults
        return defaultWorkConfig();
    }
}

export async function loadConfig(): Promise<WorkConfig> {
    const configPath = resolve(homedir(), ".work.config.json");
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
        // @ts-ignore
        config.summary = parsedConfig.summary;
    }

    return config;
}
