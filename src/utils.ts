import * as path from 'path';

export function replaceVarInPath(pathTemplate: string, searchValue: string, replaceValue: string) {
    const pathParts = pathTemplate.split(searchValue).reduce<string[]>((result, part, i, parts) => {
        const isLastPart = i === parts.length - 1;
        return isLastPart ? [...result, part] : [...result, part, replaceValue];
    }, []);
    // add back leading "./" when present in pathTemplate
    return `${pathTemplate.startsWith('./') ? './' : ''}${path.join(...pathParts)}`;
}
