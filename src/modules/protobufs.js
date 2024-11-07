import { readFileSync } from "fs";

export function ProcessProtobufs(sdk) {
    const protobufFilesToUpdate = JSON.parse(readFileSync("data/protobuf/files.json").toString())
    var uploadJson = {}
    for(const file of protobufFilesToUpdate) {
        uploadJson[`protobufs/${file}`] = readFileSync(`GameTracking-CS2/Protobufs/${file}`).toString()
    }

    return {
        swiftly: {
            files: uploadJson
        },
        documentation: {
            files: {}
        }
    }
}