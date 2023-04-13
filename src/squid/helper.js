import fs from "fs";

class Helper {
    writeNewLine() {
        fs.appendFileSync("./config.conf", "\n", "utf-8");
    }

    writeToConfig(data) {
        fs.appendFileSync("./config.conf", data, "utf-8");
    }

    writeCommentToConfig(data) {
        fs.appendFileSync("./config.conf", `#${data}`, "utf-8");
    }

    clearCurrentConfig() {
        fs.writeFileSync("./config.conf", ``, "utf-8");
    }

    clearProxyFile() {
        fs.writeFileSync("./proxies.txt", ``, "utf-8");
    }

    splitArrayToChunks(chunkSize, array) {
        let chunks = []
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

export default Helper; 