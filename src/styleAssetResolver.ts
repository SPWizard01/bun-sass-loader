
//@ts-ignore handled by bun plugin, it is an arbitrary import for a method inside importRegistry.js
import { getImportFromStyleRegistry } from "bun-scss-loader-registry"

export default function bun_css_dependency_resolver(text: string, depenencyTokens: string[]) {
    let newText = text ?? "";
    if (!newText) return newText;
    for (const token of depenencyTokens) {
      const replaceRegexp = new RegExp(
        `\\(\\"${token}\\"\\)`
      );
      const bunPath = getImportFromStyleRegistry(token);
      const resolvedPath = import.meta.resolve(bunPath);
      newText = newText.replace(replaceRegexp, `("${resolvedPath}")`);
    }
    return newText;
  }