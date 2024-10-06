import { Octokit } from '@octokit/core';
import { config } from 'dotenv'
import { createPullRequest } from 'octokit-plugin-create-pull-request';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { ProcessGameEvents } from './modules/gameevents.js';
import { SDKParser } from './modules/sdkparser.js';
import { ProcessSDKTypes } from './modules/sdktypes.js';
import { ProcessSDKClasses } from './modules/sdkclasses.js';

config()

const MyOctokit = Octokit.plugin(createPullRequest)

const octokit = new MyOctokit({
    auth: process.env.GITHUB_ACC_TOKEN,
});

if(existsSync("GameTracking-CS2")) {
    execSync("cd GameTracking-CS2; git fetch; git pull origin master")
} else {
    execSync("git clone https://github.com/SteamDatabase/GameTracking-CS2")
}

const processFunctions = [ProcessGameEvents, ProcessSDKTypes, ProcessSDKClasses]
var output = {
    swiftly: {
        files: {}
    },
    documentation: {
        files: {}
    }
}
const parsedSDK = SDKParser()

for(const func of processFunctions) {
    const out = func(parsedSDK)
    output.swiftly.files = {...output.swiftly.files, ...out.swiftly.files}
    output.documentation.files = {...output.documentation.files, ...out.documentation.files}
}

const dt = new Date();
const date = `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`

for(const key of Object.keys(output)) {
    octokit.createPullRequest({
        owner: "swiftly-solution",
        repo: key,
        title: `[Automation] CS2 Update - ${date}`,
        body: "This is an automatically generated pull request which implements the new Counter Strike 2 SDK changes.",
        head: `auto/cs2-update-${date}`,
        base: "master",
        update: true,
        changes: [
            {
                files: output[key].files,
                commit: `[Automation] CS2 Update - ${date}`
            }
        ]
    })
}