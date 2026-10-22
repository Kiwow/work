import { execSync } from "node:child_process";

export function openWorkfileForEdit(path: string): void {
    const editor = process.env["EDITOR"] || "vim";
    const command = `${editor} ${path}`;
    execSync(command, { stdio: ["ignore", "inherit", "inherit"] });
}
