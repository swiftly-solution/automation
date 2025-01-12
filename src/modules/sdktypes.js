export function ProcessSDKTypes(sdk) {
    var documentation = {}
    var output = {}

    for (var enumName of Object.keys(sdk.types)) {
        documentation[enumName.replace(/:/g, "_").toLowerCase()] = {
            title: enumName.replace(/:/g, "_"),
            template: "types-syntax",
            values: sdk.types[enumName].data
        }
        output[enumName.replace(/:/g, "_")] = sdk.types[enumName].data
    }

    return {
        swiftly: {
            files: {
                "plugin_files/gamedata/sdk_types.json": JSON.stringify(output, null, 4)
            }
        },
        documentation: {
            files: {
                "data/sdktypes/data.json": JSON.stringify(documentation, null, 4)
            }
        }
    }
}