import Helper from "./helper.js";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import { readConfig } from "../utils/config/read.js";
import { execSync } from 'child_process';
import { getIps } from "../calculator/calculator.js";
import randomstring from "randomstring";

const helper = new Helper();

const writeUserSectionName = (userName, startPort, ipCount, addressess) => {
    helper.writeNewLine();
    helper.writeCommentToConfig(`Config section for: ${userName}\n`);
    helper.writeCommentToConfig(`Port range: ${startPort} - ${startPort + ipCount}\n`);
    helper.writeCommentToConfig(`IP range: ${addressess[0]} - ${addressess[addressess.length - 1]}\n`);
    helper.writeNewLine();
}

const writePort = (port) => {
    helper.writeToConfig(`http_port ${port}\n`);
    helper.writeNewLine();
    helper.writeToConfig(`acl port_${port} localport ${port}\n`);
    helper.writeNewLine();

}

const asignAuthToPort = (port, user) => {
    helper.writeToConfig(`acl auth_${user} proxy_auth ${user}\n`);
    helper.writeToConfig(`http_access allow auth_${user} port_${port}\n`);
}

const writeOutgoingAddress = (addressess, port) => {
    helper.writeNewLine();
    addressess.forEach(ip => {
        const uuid = uuidv4().replaceAll("-", "");

        helper.writeToConfig(`acl ${uuid} localip ${ip}\n`);
        helper.writeToConfig(`tcp_outgoing_address ${ip} ${uuid}\n`);

        helper.writeNewLine();
    });
}

const writeBoilerPlate = (authPath) => {
    const boilerPlate = `auth_param basic program /usr/lib/squid3/basic_ncsa_auth ${authPath}\nauth_param basic realm proxy\n\nacl authenticated proxy_auth REQUIRED\n\ncache deny all\n`;

    helper.writeToConfig(boilerPlate);

    helper.writeToConfig(`range_offset_limit 0\n`);
    helper.writeToConfig(`quick_abort_min 0 KB\n`);
    helper.writeToConfig(`quick_abort_max 0 KB\n`);
    helper.writeToConfig(`shutdown_lifetime 0 seconds\n`);
    helper.writeToConfig(`quick_abort_pct 70\n\n`);
    helper.writeToConfig(`max_filedesc 65535\n`);

    helper.writeToConfig(`cache_mem 200 MB\n`);
    helper.writeToConfig(`icp_port 0\n`);
    helper.writeToConfig(`htcp_port 0\n`);
    helper.writeToConfig(`icp_access deny all\n`);
    helper.writeToConfig(`htcp_access deny all\n`);
    helper.writeToConfig(`snmp_port 0\n`);
    helper.writeToConfig(`snmp_access deny all\n`);
    helper.writeToConfig(`pipeline_prefetch on\n`);
    helper.writeToConfig(`memory_pools on\n`);
    helper.writeToConfig(`memory_pools_limit 50 MB\n`);
    helper.writeToConfig(`maximum_object_size 2048 KB\n`);
    helper.writeToConfig(`maximum_object_size_in_memory 1024 KB\n`);
    helper.writeToConfig(`ipcache_size 4096\n`);
    helper.writeToConfig(`ipcache_low 90\n`);
    helper.writeToConfig(`ipcache_high 95\n`);
    helper.writeToConfig(`maximum_object_size_in_memory 50 KB\n`);
    helper.writeToConfig(`cache_store_log none\n`);
    helper.writeToConfig(`half_closed_clients off\n`);
    helper.writeToConfig(`pid_filename /var/run/squid/kierylo.pid\n`);
    helper.writeToConfig(`cache_dir ufs /var/spool/squid/kierylo 7000 16 256\n`);
    helper.writeToConfig(`cache_effective_user proxy\n`);
    helper.writeToConfig(`forwarded_for delete\n`);
    helper.writeToConfig(`request_header_access Via deny all\n`);

    helper.writeNewLine();
}

const writeProxies = (addresses, user, password, port) => {
    let proxies = ``;

    addresses.forEach(ip => proxies += `${ip}:${port}:${user}:${password}\n`);

    fs.appendFileSync(`proxies.txt`, proxies, "utf-8");
}

const getPortChangeInfo = (portCount, ipCount) => {
    const rest = ipCount % portCount;
    const portIncrementInteger = Math.floor(ipCount / portCount);

    return { rest, portIncrementInteger };
}


export function writeSquidConfig() {
    helper.clearCurrentConfig();
    helper.clearProxyFile();

    let { userChunkSize, startPort, authFilePath, chunksPerPort } = readConfig()["squid"];
    const { subnets } = readConfig();

    let addresses = [];

    for (const subnet of subnets) {
        addresses = addresses.concat(getIps(subnet));
    }

    writeBoilerPlate(authFilePath);

    const addyChunks = helper.splitArrayToChunks(userChunkSize, addresses);

    let i = 0;
    for (const chunk of addyChunks) {
        const username = randomstring.generate(8).toLowerCase();
        const password = randomstring.generate(8).toLowerCase();

        console.log("Creating user:", username);

        execSync(`htpasswd -b passwords ${username.toLowerCase()} ${password.toLowerCase()}`);

        writeUserSectionName(username, startPort, chunk.length, chunk);
        writePort(startPort);
        asignAuthToPort(startPort, username);
        writeOutgoingAddress(chunk, startPort);
        writeProxies(chunk, username, password, startPort);

        if ((i % chunksPerPort) == 0) startPort++;
        i++;
    }
}