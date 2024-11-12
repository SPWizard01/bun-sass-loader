import type { OnLoadResult } from "bun";

export type CompileOptions = {
  minify?: boolean;
  cssModules?: boolean;
  targets?: string[];
  processUrlImports?: boolean;
};

export default async function compileCSS(content: string, path: string, options: CompileOptions = {}): Promise<OnLoadResult> {
  const css = await import("lightningcss-wasm");
  const imports: string[] = [];
  const urlImports: string[] = [];
  const targets = options.targets?.length ? css.browserslistToTargets(options.targets) : undefined;
  const { code, exports, dependencies } = css.transform({
    filename: path,
    code: Uint8Array.from(Buffer.from(content)),
    cssModules: Boolean(options.cssModules),
    minify: options.minify,
    targets,
    analyzeDependencies: true,
    visitor: {
      Rule: {
        import(rule) {
          imports.push(rule.value.url);
          return [];
        },
      },
      Url(urlObject) {
        const isDataOrHttp = urlObject.url.startsWith("data:") || urlObject.url.startsWith("http");
        if (isDataOrHttp || !options.processUrlImports) return urlObject;
        urlImports.push(urlObject.url);
        return urlObject;
      },
    }
  });

  let importedUrls = ``
  let placehoders = `[`;
  if (urlImports.length > 0) {
    const unique = new Map((dependencies || []).map(obj => [obj.placeholder, obj]));
    importedUrls += `import { registerStyleImport } from "bun-sass-loader-registry";\n`;
    unique.forEach((dep, index) => {
      importedUrls += `import styleDependencyImport${index} from "${dep.url}";`
      importedUrls += `registerStyleImport("${dep.placeholder}",styleDependencyImport${index});\n`
      placehoders += `"${dep.placeholder}",`
    });
  }
  placehoders += `]`;
  const codeString = code.toString();
  const needsResolving = !!!dependencies; //codeString.includes("[BUN_RESOLVE]");
  const styleResolver = needsResolving ? `import bun_style_resolver from "bun-sass-loader-resolver";` : "";
  const withResolver = needsResolving ? `bun_style_resolver(\`${codeString}\`, ${placehoders})` : `\`${codeString}\``;
  const nameMap = Object.fromEntries(Object.entries(exports || {}).map(([key, item]) => [key, item.name]));
  const imported = imports.map((url, i) => `import _css${i} from "${url}";`).join("\n");
  const exported = imports.map((_, i) => `_css${i}`).join(" + ");

  const codeExport = exported ? `${exported} + ${withResolver}` : withResolver;

  const exportContent = options.cssModules ? `
    export const code = ${codeExport};
    export default ${JSON.stringify(nameMap)};
  ` :
    `export default ${codeExport};`;

  let contents = `
    ${styleResolver}
    ${importedUrls}
    ${imported}
    ${exportContent}
  `

  return {
    contents,
    loader: "js",
  };
}