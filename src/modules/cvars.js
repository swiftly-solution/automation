import { readFileSync } from "fs";

export function ProcessCVars(tmp) {
    const commandsFile = readFileSync("GameTracking-CS2/DumpSource2/convars.txt").toString()
    const commandBlocks = commandsFile.split("\n\n");

    const docsOutput = {}

    for (const block of commandBlocks) {
        const commandStrings = block.split("\n");
        if (!commandStrings[1]) continue;

        const commandMain = commandStrings[0].trim()
        const description = commandStrings[1].trim()

        const commandFlags = commandMain.split("(")[1].split(")")[0].split(" ")
        const commandFullName = commandMain.split("(")[0].trim()

        const commandName = commandFullName.split(" ")[0]
        let commandValue = commandFullName.split(" ")
        commandValue.shift()
        let args = commandValue.join(" ")

        docsOutput[commandName.toLowerCase()] = {
            title: commandName,
            description,
            args: (args || ""),
            template: "command-syntax",
            flags: commandFlags
        }
    }

    return {
        swiftly: {
            files: {}
        },
        documentation: {
            files: {
                "data/convars/data.json": JSON.stringify(docsOutput, null, 4)
            }
        }
    }
}