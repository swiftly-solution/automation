import { readFileSync } from "fs";

export function ProcessCommands(tmp) {
    const commandsFile = readFileSync("GameTracking-CS2/DumpSource2/commands.txt").toString()
    const commandBlocks = commandsFile.split("\n\n");

    const docsOutput = {}

    for (const block of commandBlocks) {
        const commandStrings = block.split("\n");
        const commandMain = commandStrings[0].trim()
        if (!commandStrings[1]) continue;
        const description = commandStrings[1].trim()

        let args = commandStrings[2]
        if (typeof args == "string") args = args.split(":")[1]

        const commandFlags = commandMain.split("(")[1].split(")")[0].split(" ")
        const commandName = commandMain.split("(")[0].trim()

        docsOutput[commandName.toLowerCase()] = {
            title: commandName,
            description,
            args: (args || ""),
            category: "command-syntax",
            flags: commandFlags
        }
    }

    return {
        swiftly: {
            files: {}
        },
        documentation: {
            files: {
                "data/commands/data.json": JSON.stringify(docsOutput, null, 4)
            }
        }
    }
}