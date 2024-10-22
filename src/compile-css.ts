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
    minify: true,
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
  const styleResolver = `
    import bun_style_resolver from "bun-style-loader-resolver";
  `
  const importedUrls = urlImports.map((url) => `import "${url}";`).join('\n');
  if (options.cssModules) {
    const nameMap = Object.fromEntries(Object.entries(exports || {}).map(([key, item]) => [key, item.name]));
    return {
      contents: `
        ${importedUrls}
        export const code = ${JSON.stringify(code.toString())};
        export default ${JSON.stringify(nameMap)};
      `,
      loader: 'js',
    };
  }

  let defaultContent = `export default ${JSON.stringify(code.toString())};`;
  if (defaultContent.indexOf("[BUN_RESOLVE]") !== -1) {
    defaultContent = `
      ${styleResolver}
      export default bun_style_resolver(${JSON.stringify(code.toString())});
    `

  }
  if (imports.length === 0 && urlImports.length === 0) {
    return {
      contents: defaultContent,
      loader: 'js',
    };
  }

  const imported = imports.map((url, i) => `import _css${i} from "${url}";`).join('\n');
  const exported = imports.map((_, i) => `_css${i}`).join(' + ');
  if (imports.length > 0) {

    const codeString = code.toString();
    defaultContent = `
      ${imported}
      export default ${exported} + ${JSON.stringify(codeString)};
    `;
    if (codeString.indexOf("[BUN_RESOLVE]") !== -1) {
      defaultContent = `
      ${styleResolver}
      ${imported}
      export default ${exported} + bun_style_resolver(${JSON.stringify(codeString)});
    `
    }

  }
  return {
    contents: `
      ${importedUrls}
      ${defaultContent}
    `,
    loader: 'js',
  };
}
