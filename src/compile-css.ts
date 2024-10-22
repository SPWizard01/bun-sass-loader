import type { OnLoadResult } from 'bun';

export type CompileOptions = {
  minify?: boolean;
  cssModules?: boolean;
  targets?: string[];
};

export default async function compileCSS(content: string, path: string, options: CompileOptions = {}): Promise<OnLoadResult> {
  const css = await import('lightningcss-wasm');
  const imports: string[] = [];
  const urlImports: string[] = [];
  const targets = options.targets?.length ? css.browserslistToTargets(options.targets) : undefined;
  const { code, exports } = css.transform({
    filename: path,
    code: Uint8Array.from(Buffer.from(content)),
    cssModules: Boolean(options.cssModules),
    minify: options.minify,
    targets,
    visitor: {
      Rule: {
        import(rule) {
          imports.push(rule.value.url);
          return [];
        },
      },
      Url(urlObject) {
        const isDataOrHttp = urlObject.url.startsWith('data:') || urlObject.url.startsWith('http');
        if (isDataOrHttp) return urlObject;
        urlImports.push(urlObject.url);
        return {
          loc: urlObject.loc,
          url: `[BUN_RESOLVE]${urlObject.url}[/BUN_RESOLVE]`
        }
      },
    }
  });

  const importedUrls = urlImports.map((url) => `import "${url}";`).join('\n');
  const codeString = code.toString();
  const needsResolving = codeString.includes("[BUN_RESOLVE]");
  const styleResolver = needsResolving ? `import bun_style_resolver from "bun-style-loader-resolver";` : '';
  const withResolver = needsResolving ? `bun_style_resolver(${JSON.stringify(codeString)})` : JSON.stringify(codeString);

  if (options.cssModules) {
    const nameMap = Object.fromEntries(Object.entries(exports || {}).map(([key, item]) => [key, item.name]));
    return {
      contents: `
        ${styleResolver}
        ${importedUrls}
        export const code = ${withResolver};
        export default ${JSON.stringify(nameMap)};
      `,
      loader: 'js',
    };
  }


  if (imports.length === 0) {
    return {
      contents: `
        ${styleResolver}
        ${importedUrls}
        export default ${withResolver};
      `,
      loader: 'js',
    };
  }

  const imported = imports.map((url, i) => `import _css${i} from "${url}";`).join('\n');
  const exported = imports.map((_, i) => `_css${i}`).join(' + ');


  return {
    contents: `
      ${styleResolver}
      ${importedUrls}
      ${imported}
      export default ${exported} + ${withResolver};
    `,
    loader: 'js',
  };
}