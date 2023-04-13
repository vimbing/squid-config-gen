import yaml from "js-yaml";
import fs from "fs";
import { readConfig } from "../utils/config/read.js";
import { getIps } from "../calculator/calculator.js";

export function generateNetplanConfig() {
    const { subnets,
        netplanNameServers,
        netplanOtherAddressess,
        netplanGetway,
        netplanInterfaceName
    } = readConfig();

    let addressess = [];

    for (const subnet of subnets) {
        const mask = subnet.split("/")[1];
        addressess = addressess.concat(getIps(subnet).map(ip => `${ip}/${mask}`))
    }

    const myInput = {
        "network":
        {
            "ethernets":
            {
                [netplanInterfaceName]: {
                    "addresses": addressess.concat(netplanOtherAddressess),
                    "gateway4": netplanGetway,
                    "nameservers": {
                        "addresses": netplanNameServers,
                        "search": []
                    },
                    "set-name": netplanInterfaceName
                }
            },
            "version": 2
        }
    }


    fs.writeFileSync("00-installer-config.yaml", yaml.dump(myInput))
}