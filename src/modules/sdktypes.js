export function ProcessSDKTypes(sdk) {
    var documentation = {}
    var output = {}

    for (const enumName of Object.keys(sdk.types)) {
        if (enumName.includes(":")) continue
        documentation[enumName.toLowerCase()] = {
            title: enumName,
            template: "types-syntax",
            values: sdk.types[enumName].data
        }
        output[enumName] = sdk.types[enumName].data
    }

    return {
        swiftly: {
            files: {
                "plugin_files/gamedata/cs2/sdk_types.json": JSON.stringify(output, null, 4)
            }
        },
        documentation: {
            files: {
                "data/sdktypes/data.json": JSON.stringify(documentation, null, 4)
            }
        }
    }
}