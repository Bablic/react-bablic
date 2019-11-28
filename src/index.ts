#!/usr/bin/env node
import * as yargs from 'yargs';
import {createEditor, createLocale, EditorOptions, LocaleOptions, openEditor, OpenEditorOptions} from "./i18N";
import {login, LoginOptions, createSite, InitOptions} from "bablic-i18n";

function runCommand(promise: Promise<void>) {
    promise.then(() => {
        console.error("Done");
        process.exit(0);
    }, (e) => {
        console.error("Error: ", e);
        process.exit(1);
    });
}

let command = false;
yargs
    .command<InitOptions>("init [name] [originalLocale]", "Init a new site in Bablic", (builder) => {
        builder.positional("name", {
            type: "string",
            describe: "Name of your website",
        }).positional("originalLocale", {
            type: "string",
            describe: "Your website original locale"
        }).demandOption("name").demandOption("originalLocale");
    }, (params) => {
        command = true;
        if (params.verbose) {
            console.log("Create site", params.name, params.originalLocale);
        }
        runCommand(createSite("react", params));
    }).command<LoginOptions>("login", "Login the CLI", (builder) => {},
    (params) => {
        command = true;
        if (params.verbose) {
            console.log("Opening login");
        }
        runCommand(login(params));
    })
    .command<EditorOptions>("create-editor [site]", "Generate the editor localization file", (builder) => {
        builder.option("outFile", {
            type: "string",
            alias: ['out-file', 'o'],
            default: "./editor.js",
            describe: "Output translations file path",
        }).option("sourceFile", {
            type: "string",
            alias: ['source-file', 's'],
            describe: "Source translation file path"
        }).option("skipScan", {
            type: "boolean",
            default: false,
            describe: "Prevent from scanning the project for translations phrases. Instead will use the translation file"
        })
            .positional("site", {
                type: "string",
                describe: "Unique site name"
            }).demand("site");
    }, (params) => {
        command = true;
        if (params.verbose) {
            console.log("Create editor file", params);
        }
        runCommand(createEditor(params));
    })
    .command<OpenEditorOptions>("open-editor [site]", "Open editor", (builder) => {
        builder
            .option("sourceFile", {
                type: "string",
                alias: ['source-file', 's'],
                describe: "Source translation file path"
            })
            .option("prod", {
                type: "boolean",
                default: false,
            })
            .option("skipScan", {
                type: "boolean",
                default: false,
                describe: "This skips scanning of translations using i18next-scan"
            })
            .positional("site", {
                type: "string",
                describe: "Unique site name"
            }).demand("site");
    }, (params) => {
        command = true;
        if (params.verbose) {
            console.log("Open editor", params);
        }
        runCommand(openEditor(params));
    })
    .command<LocaleOptions>("create-translation [site]", "Generate the translated localization file", (builder) => {
        builder.positional("locale", {
            type: "string",
            describe: "The language to translate to",
        }).option("outFile", {
            type: "string",
            alias: ['out-file', 'o'],
            default: "./[locale].js",
            describe: "Output translation file path",
        }).option("skipScan", {
            type: "boolean",
            default: false,
        }).option("sourceFile", {
            type: "string",
            alias: ['source-file', 's'],
            describe: "Source translation file path"
        }).positional("site", {
            type: "string",
            describe: "Unique site name"
        }).demand("site").demand("locale");
    }, (params) => {
        command = true;
        params.outFile = params.outFile.replace("[locale]", params.locale);
        if (params.verbose) {
            console.log("Create editor file", params);
        }
        runCommand(createLocale(params));
    })
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging'
    }).strict()
    .argv;

if (!command) {
    console.log("non-existing or no command specified");
    yargs.showHelp();
}
