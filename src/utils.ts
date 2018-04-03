import { exec } from 'child_process';

import * as path from 'path';
import { BlackEditProvider } from './BlackEditProvider';
const minBlackVersion: string = require('../package.json').minBlackVersion;

export function replaceVarInPath(pathTemplate: string, searchValue: string, replaceValue: string) {
    // searchValue not present, early exit
    if (pathTemplate.indexOf(searchValue) === -1) return pathTemplate;

    const pathParts = pathTemplate.split(searchValue).reduce<string[]>((result, part, i, parts) => {
        const isLastPart = i === parts.length - 1;
        return isLastPart ? [...result, part] : [...result, part, replaceValue];
    }, []);

    // add back leading "./" when present in pathTemplate
    return `${pathTemplate.startsWith('./') ? './' : ''}${path.join(...pathParts)}`;
}

export class Version {
    year: number;
    month: number;
    type: string;
    micro: number;

    constructor(version: string) {
        const matches = version.match(/(\d+)\.(\d+)(a|b|c|\.)(\d+)/);
        if (!matches) throw Error(`Invalid version string "${version}".`);
        this.year = parseInt(matches[1]);
        this.month = parseInt(matches[2]);
        this.type = matches[3];
        this.micro = parseInt(matches[4]);
    }

    valueOf() {
        const { type, year, month, micro } = this;

        let typeVal = 4;
        if (type === 'a') typeVal = 1;
        else if (type === 'b') typeVal = 2;
        else if (type === 'c') typeVal = 3;

        return year * 1000000 + month * 10000 + typeVal * 1000 + micro;
    }

    toString() {
        const { type, year, month, micro } = this;
        return `${year}.${month}${type}${micro}`;
    }
}

export function blackVersionIsIncompatible(provider: BlackEditProvider) {
    return new Promise<string | undefined>((resolve, reject) => {
        let exitCode: number;
        const checkVersionCmd = `${provider.getCommand(provider.getConfig(null))}-version`;
        exec(checkVersionCmd, (error, stdout, stderr) => {
            if (exitCode === 0) {
                try {
                    const minVersion = new Version(minBlackVersion);
                    const envVersion = new Version(stdout);
                    if (envVersion < minVersion) {
                        const versionErrorMessage = `Black v${envVersion} is no longer supported, v${minVersion} or greater is required. Try \`pip install -U black\`.`;
                        resolve(versionErrorMessage);
                    }
                } catch {
                    // pass
                }
                resolve();
            }
        }).on('exit', code => {
            exitCode = code;
        });
    });
}
