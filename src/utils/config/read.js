import fs from "fs";

export function readConfig() {
    return JSON.parse(fs.readFileSync("./config.json", "utf-8"));
}