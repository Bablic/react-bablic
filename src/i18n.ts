import {execShellCommand, jsonPost, postStream, saveToken, waitForLogin, waitForSigterm,
    createEditorFile, createTranslationFile, uploadSiteAndOpenEditor} from "bablic-i18n";
import {createReadStream, createWriteStream} from "fs";
import * as os from "os";
import {BaseOptions} from "bablic-i18n";
import {Readable, Writable} from "stream";
import * as vfs from "vinyl-fs";
import * as sort from "gulp-sort";
const i18nextParser = require("i18next-parser");
import ReadWriteStream = NodeJS.ReadWriteStream;
import {copy, ensureDir, move, remove, pathExists, appendFile, readFile} from "fs-extra";

export interface EditorOptions extends BaseOptions {
    site: string;
    outFile: string;
    sourceFile?: string;
    skipScan: boolean;
}

export function createEditor(params: EditorOptions): Promise<void> {
    return createLocale({
        site: params.site,
        sourceFile: params.sourceFile,
        outFile: params.outFile,
        locale: "editor",
        skipScan: params.skipScan,
        verbose: params.verbose,
    });
}

export interface LocaleOptions extends BaseOptions {
    site: string;
    locale: string;
    outFile: string;
    sourceFile?: string;
    skipScan: boolean;
}

export async function createLocale(params: LocaleOptions): Promise<void> {
    let reader: NodeJS.ReadableStream;
    if (!params.sourceFile) {
        if (params.skipScan) {
            throw new Error("Skip scan is on, but source file is not given");
        }
        reader = await scanTranslations();
        console.error("Using i18next-scanner to get translations");

    } else {
        console.error("Not scanning, using source file", params.sourceFile);
        reader = createReadStream(params.sourceFile);
    }
    console.error("Getting translated localization file");
    const fileWriter = createWriteStream(params.outFile);
    await createTranslationFile(reader as Readable, fileWriter, params.site, params.locale, "react");
    console.error("File written successfully");
}

export interface OpenEditorOptions extends BaseOptions {
    site: string;
    sourceFile: string;
    prod?: boolean;
    skipScan?: boolean;
}

export async function openEditor(params: OpenEditorOptions): Promise<void> {
    const tempRootDir = os.tmpdir() + '/bablic';
    await remove(tempRootDir);
    await ensureDir(tempRootDir);
    const tempFile = tempRootDir + `/${params.site}.editor.js`;
    await createEditor({
        site: params.site,
        sourceFile: params.sourceFile,
        outFile: tempFile,
        skipScan: params.skipScan,
        verbose: params.verbose,
    });
    let codeToAppend = await readFile(__dirname + "/../src/code-append.js", {encoding: 'utf8'});
    let resourcesString = await readFile(tempFile, {encoding: 'utf8'});
    codeToAppend = codeToAppend.replace("'{{RESOURCES}}'",resourcesString);
    const tempDir = tempRootDir + `/${params.site}.editor/`;
    const tempStash = tempRootDir + '/build.stash/';
    const tempIndex = tempRootDir + '/index.js';
    await copy('./build', tempStash, {recursive: true, overwrite: true});
    await copy('./src/index.js', tempIndex, {recursive: true, overwrite: true});
    try {
        let command: string[] = [`run`, 'build'];
        await appendFile('./src/index.js', codeToAppend);
        await execShellCommand("npm", command);
        await move('./build', tempDir);
    } finally {
        if (await pathExists('./build')) {
            await remove('./build');
        }
        await move(tempStash, './build', {overwrite: true});
        await move(tempIndex, './src/index.js', {overwrite: true});
    }
    await uploadSiteAndOpenEditor(tempDir, params.site, "react");
}


async function scanTranslations(): Promise<NodeJS.ReadableStream> {
    const tempRootDir = os.tmpdir() + '/bablic';
    await ensureDir(tempRootDir);
    return new Promise((resolve, reject) => {
        const dest = vfs.dest(tempRootDir);
        vfs.src("src/**/*.{js,ts,hbs}")
            .pipe(sort()) // Sort files in stream by path
            //.pipe(scanner({}));
            .pipe(new i18nextParser.gulp({output: "file.js"}))
            .pipe(dest);
        dest.on('finish', () => {
            resolve(createReadStream(tempRootDir + '/file.js') as NodeJS.ReadableStream);
        });
        dest.on('close', () => {
            resolve(createReadStream(tempRootDir + '/file.js') as NodeJS.ReadableStream);
        });
    });
}

