
//@ts-ignore handled by bun plugin, it is an arbitrary import for a method inside importRegistry.js
import { getImportFromStyleRegistry } from "bun-sass-loader-registry"

export default function bun_style_resolver(text: string) {
    let newText = text ?? "";
    if (!newText) return newText;
  
    const pathSearch = new RegExp(
      /(\[BUN_RESOLVE\])(?<RelativePath>.*)(\[\/BUN_RESOLVE\])/g
    );
    const foundResources = text.matchAll(pathSearch);
    for (const iterator of foundResources) {
      const relPath = iterator["groups"]!.RelativePath;
      const escapedPath = relPath.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
      const replaceRegexp = new RegExp(
        `\\[BUN_RESOLVE\\]${escapedPath}\\[\\/BUN_RESOLVE\\]`
      );
      const bunPath = getImportFromStyleRegistry(relPath);
      const resolvedPath = import.meta.resolve(bunPath);
      newText = newText.replace(replaceRegexp, `"${resolvedPath}"`);
    }
    return newText;
  
  }