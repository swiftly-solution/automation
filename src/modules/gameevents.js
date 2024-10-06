import { readFileSync } from "fs";
import { FetchTemplate, ReplacePlaceholder } from "./templates.js";
import { parse } from "vdf-parser";

export function ProcessGameEvents(tmp) {
    const ignoredEvents = JSON.parse(readFileSync("data/gameevents/ignored_events.json").toString())
    const eventPaths = JSON.parse(readFileSync("data/gameevents/paths.json").toString())
    const GameEvents = ["std::map<std::string, std::string> gameEventsRegister = {"]
    var gameEventData = {}
    var gameEventsDocs = {}

    for(const path of eventPaths) {
        const parsedVDF = parse(readFileSync(path).toString())
        const events = Object.values(parsedVDF)[0]
        for(const k in events) {
            if(ignoredEvents.includes(k)) continue;
            if(gameEventData.hasOwnProperty(k)) {
                gameEventData[k] = { ...gameEventData[k], ...events[k] }
            } else {
                gameEventData[k] = events[k]
            }
        }
    }

    for(const [eventName, eventData] of Object.entries(gameEventData)) {
        const comment = `This event is triggered when ${eventName} is triggered.`
        const commentPost = `This event is triggered after ${eventName} is triggered.`
        const processedEventName = `On${eventName.split("_").map((a) => (a.charAt(0).toUpperCase() + a.slice(1))).join("")}`;

        if (eventData.local) continue;

        var params = {}

        for (const key in eventData) {
            if (eventData[key] == 1 || eventData[key] == "ehandle") continue;

            if (eventData[key] == "string") params[key] = "string"
            else if (eventData[key] == "short") params[key] = "int"
            else if (eventData[key] == "int") params[key] = "int"
            else if (eventData[key] == "uint64") params[key] = "uint64"
            else if (eventData[key] == "long") params[key] = "int"
            else if (eventData[key] == "bool") params[key] = "boolean"
            else if (eventData[key] == "player_controller") params[key] = "int"
            else if (eventData[key] == "byte") params[key] = "int"
            else if (eventData[key] == "float") params[key] = "float"
            else if (eventData[key] == "player_controller_and_pawn") params[key] = "int"
            else if (eventData[key] == "player_pawn") params[key] = "int"
        }

        GameEvents.push(`    { "${eventName}", "${processedEventName}" },`)
        gameEventsDocs[processedEventName.toLowerCase()] = {
            title: processedEventName,
            template: "game-event-syntax",
            description: comment,
            return: {
                lua: "void"
            },
            params,
            additional: {}
        }
    
        gameEventsDocs[`${processedEventName.replace("On", "OnPost")}`.toLowerCase()] = {
            title: `${processedEventName.replace("On", "OnPost")}`,
            template: "game-event-syntax",
            description: commentPost,
            return: {
                lua: "void"
            },
            params,
            additional: {}
        }
    }

    GameEvents.push("};")

    return {
        swiftly: {
            files: {
                "src/engine/gameevents/GGameEvents.h": ReplacePlaceholder(FetchTemplate("gameevents"), "generated", GameEvents.join("\n"))
            }
        },
        documentation: {
            files: {
                "docgen/data/data_gameevents.json": JSON.stringify(gameEventsDocs, null, 4)
            }
        }
    }
}