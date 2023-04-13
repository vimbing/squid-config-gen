import { generateNetplanConfig } from "./src/netplan/netplan.js"
import { writeSquidConfig } from "./src/squid/squid.js"

(function () {
    generateNetplanConfig();
    writeSquidConfig()
}())