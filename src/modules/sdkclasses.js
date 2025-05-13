import { readFileSync } from "fs"

const numberKeys = ["int", "int32_t", "uint8_t", "uint8", "int32", "uint64_t", "uint64", "uint32_t", "uint32", "uint16_t", "uint16", "int8_t", "int8", "float", "float32", "int16_t", "int16", "double", "float64"]

const dataTypeMap = {
    int8: 0,
    int16: 1,
    int32: 2,
    int64: 3,
    uint8: 4,
    uint16: 5,
    uint32: 6,
    uint64: 7,
    float: 8,
    double: 9,
    bool: 10,
    Parent: 11,
    CUtlStringToken: 12,
    CUtlSymbolLarge: 13,
    CUtlString: 14,
    "char*": 15,
    class: 16,
    sdkchandle: 17,
    Color: 19,
    QAngle: 20,
    Vector: 21,
    Vector2D: 22,
    Vector4D: 23,
    "class*": 24,
    "CEntityIndex*": 25,
    "CUtlSymbolLarge*": 26,
    "CUtlStringToken*": 27,
    "CUtlString*": 28,
    "int8*": 29,
    "int16*": 30,
    "int32*": 31,
    "int32*": 31,
    "int64*": 32,
    "uint8*": 33,
    "uint16*": 34,
    "uint32*": 35,
    "uint64*": 36,
    "float*": 37,
    "double*": 38,
    "bool*": 39,
    "Color*": 40,
    "QAngle*": 41,
    "Vector*": 42,
    "Vector2D*": 43,
    "Vector4D*": 44,
    "Class*": 45,
    "CHandle*": 46,
    cutlvectorchandle: 47,
    cutlvectorcutlsymbollarge: 48,
    cutlvectorcutlstringtoken: 49,
    cutlvectorcutlstring: 50,
    cutlvectorint8: 51,
    cutlvectorint8: 51,
    cutlvectorint16: 52,
    cutlvectorint16: 52,
    cutlvectorint32: 53,
    cutlvectorint32: 53,
    cutlvectorint64: 54,
    cutlvectorint64: 54,
    cutlvectoruint8: 55,
    cutlvectoruint8: 55,
    cutlvectoruint16: 56,
    cutlvectoruint16: 56,
    cutlvectoruint32: 57,
    cutlvectoruint32: 57,
    cutlvectoruint64: 58,
    cutlvectoruint64: 58,
    cutlvectorfloat: 59,
    cutlvectorfloat32: 59,
    cutlvectordouble: 60,
    cutlvectorcolor: 61,
    cutlvectorqangle: 62,
    cutlvectorvector: 63,
    cutlvectorvector2d: 64,
    cutlvectorvector4d: 65,
    cutlvectorbool: 66
}

var classnames = {}
var enums = {}

function GenerateFieldType(field) {
    const isPointer = field.dataType.includes("*")
    let type = field.dataType

    let extraData = {}

    if (!isPointer) {
        if (classnames.includes(type)) {
            extraData.classname = type
            type = "class"
        }
        else if (enums.hasOwnProperty(type))
            type = enums[type]

        if (dataTypeMap[type] != undefined) extraData.type = dataTypeMap[type]
        else if (type.includes("[")) {
            let newType = `${type.split("[").shift()}*`;
            const size = type.split("[").pop().split("]").shift()

            if (newType.includes("CHandle")) newType = `CHandle*`
            if (classnames.includes(newType.split("*").shift())) newType = `Class*`
            if (enums.hasOwnProperty(newType.split("*").shift())) newType = `${enums[newType.split("*").shift()]}*`
            if (newType.includes("**")) return extraData

            extraData.type = dataTypeMap[newType]
            extraData.size = Number(size)
        } else if (type.startsWith("CHandle")) {
            const className = type.split("<").pop().split(">").shift()
            extraData.type = dataTypeMap["sdkchandle"]
            extraData.classname = className
        } else if (type.startsWith("CUtlVector<")) {
            if (type.includes("CHandle")) {
                const className = type.split("CUtlVector<CHandle<").pop().split(">").shift()
                extraData.type = dataTypeMap["cutlvectorchandle"]
                extraData.classname = className
            } else {
                let dataType = type.split("<").pop().split(">").shift()

                if (classnames.includes(dataType)) return extraData
                if (dataType.includes("*")) return extraData
                if (enums.hasOwnProperty(dataType)) dataType = enums[dataType]

                dataType = `cutlvector${dataType.toLowerCase()}`

                if (dataTypeMap[dataType]) extraData.type = dataTypeMap[dataType]
            }
        }

    } else {
        if (classnames.includes(type.split("*").shift())) {
            extraData.classname = type.split("*").shift()
            type = "class*"
        }
        if (dataTypeMap[type]) extraData.type = dataTypeMap[type]
    }

    if (extraData.classname && extraData.classname.startsWith("C_")) extraData.classname = extraData.classname.replace("C_", "C");

    return extraData
}

export function ProcessSDKClasses(sdk) {
    var documentation = {}
    classnames = Object.keys(sdk.classes)

    for (const typeName of Object.keys(sdk.types))
        enums[typeName] = sdk.types[typeName].offset.replace("_t", "")

    ////////////////////////////////////////////////
    //////////////     Documentation     //////////
    //////////////////////////////////////////////
    const customFunctions = JSON.parse(readFileSync("data/sdk/custom_functions.json").toString())

    for (const className of Object.keys(sdk.classes)) {
        documentation[className.toLowerCase()] = {
            title: className,
            description: "",
            template: "class-syntax",
            languages: [
                "lua",
                "js"
            ],
            constructor: {
                ptr_or_class: "string|AnySDKClass"
            },
            properties: {},
            functions: customFunctions[className] || {},
            additional: {}
        }

        for (const field of Object.keys(sdk.classes[className].fields)) {
            var type = sdk.classes[className].fields[field].dataType

            for (const cls of classnames)
                if (type.includes(cls)) {
                    type = type.replace(new RegExp(cls, "g"), `G${cls}`)
                    break
                }

            if (type.includes("CEntityIndex")) {
                type = type.replace(/CEntityIndex/g, "int")
            } else if (type.includes("char[")) {
                type = "std::string"
            } else if (type == "char*") {
                type = "std::string";
            } else if (type == "CUtlSymbolLarge") {
                type = "std::string";
            } else if (type == "CUtlString") {
                type = "std::string"
            } else if (type == "CUtlStringToken") {
                type = "uint32"
            }

            if (type.includes("][")) continue;

            if (type.includes("[")) {
                documentation[className.toLowerCase()].properties[field] = {
                    type: "table",
                    writable: true
                }
            } else if (type == "CUtlVector*") {
                continue;
            } else if (type == "std::string") {
                documentation[className.toLowerCase()].properties[field] = {
                    type: "string",
                    writable: true
                }
            } else if (type.includes("CUtlVector")) {
                documentation[className.toLowerCase()].properties[field] = {
                    type: "table",
                    writable: true
                }
            } else {
                var docsType = type
                if (docsType.includes("*")) docsType = docsType.slice(0, -1)
                else if (docsType.startsWith("CHandle<")) docsType = docsType.split("CHandle<")[1].split(">")[0]

                if (docsType.startsWith("G")) {
                    documentation[className.toLowerCase()].properties[field] = {
                        type: docsType.slice(1),
                        writable: true
                    }
                } else if (numberKeys.includes(docsType)) {
                    documentation[className.toLowerCase()].properties[field] = {
                        type: "number",
                        writable: true
                    }
                } else if (docsType == "bool") {
                    documentation[className.toLowerCase()].properties[field] = {
                        type: "boolean",
                        writable: true
                    }
                } else {
                    documentation[className.toLowerCase()].properties[field] = {
                        type: docsType,
                        writable: true
                    }
                }
            }

            if (type.includes("::") && type != "std::string") {
                delete documentation[className.toLowerCase()].properties[field];
                continue;
            }

            if (!type.includes("*") && (!type.includes("CHandle") || type.startsWith("CHandle")) && !type.includes("CUtlVector") && type != "char*" && !type.startsWith("G")) { }
            else {
                documentation[className.toLowerCase()].properties[field].writable = false
            }

            if (documentation[className.toLowerCase()].properties[field].type.startsWith("C_"))
                documentation[className.toLowerCase()].properties[field].type = documentation[className.toLowerCase()].properties[field].type.replace("C_", "C");
        }

        if (sdk.classes[className].parent && classnames.includes(sdk.classes[className].parent)) {
            documentation[className.toLowerCase()].properties["Parent"] = {
                type: sdk.classes[className].parent,
                writable: false
            }
        }

        documentation[className.toLowerCase()].functions["ToPtr"] = {
            return: {
                lua: "string",
                js: "string"
            },
            params: {}
        }
        documentation[className.toLowerCase()].functions["IsValid"] = {
            return: {
                lua: "bool",
                js: "bool"
            },
            params: {}
        }
    }
    ////////////////////////////////////////////////
    //////////////     Documentation     //////////
    //////////////////////////////////////////////

    ////////////////////////////////////////////////
    //////////////     SDK Generator     //////////
    //////////////////////////////////////////////
    var output = {}

    for (const className of Object.keys(sdk.classes)) {
        output[className] = {}

        for (const field of Object.keys(sdk.classes[className].fields)) {
            const generated = GenerateFieldType(sdk.classes[className].fields[field])
            if (Object.keys(generated).length == 0) { continue; }

            output[className][field] = {
                field: sdk.classes[className].fields[field].fieldAccessName,
                ...generated
            }
        }

        if (sdk.classes[className].parent) {
            output[className]["Parent"] = {
                field: sdk.classes[className].parent,
                type: dataTypeMap["Parent"]
            }
        }
    }

    ////////////////////////////////////////////////
    //////////////     SDK Generator     //////////
    //////////////////////////////////////////////

    return {
        swiftly: {
            files: {
                "plugin_files/gamedata/cs2/sdk.json": JSON.stringify(output, null, 4)
            }
        },
        documentation: {
            files: {
                "data/sdkclass/data.json": JSON.stringify(documentation, null, 4)
            }
        }
    }
}