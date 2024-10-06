import { readdirSync, readFileSync, statSync } from "fs";

const prefixes = [
    "psz",
    "fl",
    "a",
    "n",
    "i",
    "isz",
    "vec",
    "us",
    "u",
    "ub",
    "un",
    "sz",
    "b",
    "f",
    "clr",
    "h",
    "ang",
    "af",
    "ch",
    "q",
    "p",
    "v",
    "arr",
    "bv",
    "e",
    "s",
]

var ignorerItems = []
var replacer = {}

function ParseClass(content) {
    var className = ""
    var classData = {
        fields: {}
    }

    const rows = content.split("\n");
    for(var row of rows) {
        if(row.startsWith("class")) {
            const tokenized = row.split(" ");
            className = tokenized[1]
            if(row.includes(" : "))
                classData.parent = row.split(" : ")[1].split(" ")[1].trim();

            for(const item of ignorerItems) {
                if(className.includes(item))
                    return ["", {}];
                else if(classData.hasOwnProperty("parent"))
                    if(classData.parent.includes(item)) {
                        delete classData.parent;
                        break;
                    }
            }
        } else if(row.includes("{") || row.includes("}")) continue;
        else if(row.trim().length > 0) {
            row = row.trim();
            const exploded = row.split(" ");
            var fieldAccessName = exploded.pop().split(";").shift();
            let fieldName = fieldAccessName
            fieldName = fieldName.replace(/m_/g, "");
            for (const prefix of prefixes)
                if (fieldName.startsWith(prefix) && fieldName.charAt(prefix.length).toUpperCase() == fieldName.charAt(prefix.length)) {
                    fieldName = fieldName.replace(prefix, "")
                    break
                }
    
            fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
            var dataType = exploded.join("")

            for(const key of Object.keys(replacer))
                if(dataType.includes(key))
                    dataType = dataType.replace(new RegExp(key, "g"), replacer[key])

            var hasIgnored = false
            for(const ignored of ignorerItems)
                if(dataType.includes(ignored)) {
                    hasIgnored = true
                    break
                }

            if(hasIgnored) continue;

            if(classData.fields[fieldName] != undefined)
                fieldName = `${fieldName}${Object.keys(classData.fields).filter((v) => v.includes(fieldName)).length}`

            classData.fields[fieldName] = {
                fieldAccessName,
                dataType
            }
        }
    }

    return [className, classData]
}

function ParseEnum(content) {
    var enumName = ""
    var enumData = {}
    var offset = ""

    const rows = content.split("\n");
    for(const row of rows) {
        if(row.includes("enum")) {
            enumName = row.split(" : ")[0].split(" ").pop()
            offset = row.split(" : ")[1].split(" ").pop()
        }
        else if(row.includes("{") || row.includes("}")) 
            continue;
        else if(row.trim().length > 0) {
            const rowData = row.split(" = ")
            if(!rowData[1]) console.log(row)
            enumData[rowData[0].trim()] = Number(rowData[1].split(",")[0].trim())
        }
    }

    return [enumName, enumData, offset]
}

export function SDKParser() {
    const output = {
        classes: {},
        types: {}
    }

    ignorerItems = JSON.parse(readFileSync("data/sdk/ignorer.json"))
    replacer = JSON.parse(readFileSync("data/sdk/replacer.json"))

    for(const file of readdirSync("GameTracking-CS2/DumpSource2/schemas", { recursive: true })) {
        if(statSync(`GameTracking-CS2/DumpSource2/schemas/${file}`).isDirectory()) continue;
        const fileContent = readFileSync(`GameTracking-CS2/DumpSource2/schemas/${file}`).toString()
        if(file.includes("InfoForResourceType") || file.includes("Pulse") || file.includes("C_")) continue;

        if(fileContent.startsWith("class")) {
            const [className, classData] = ParseClass(fileContent)
            if(className == "") continue;
            output.classes[className] = classData
        } else {
            const [enumName, enumData, offset] = ParseEnum(fileContent)
            if(enumName == "") continue;
            output.types[enumName] = { data: enumData, offset }
        }
    }

    return output;
}