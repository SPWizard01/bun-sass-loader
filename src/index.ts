import type { BunPlugin } from 'bun';
import compileCSS from './compile-css';

/**
 * No options for now
 */
export type StyleLoaderOptions = {
  /**
   * List of target browsers to support
   * @example ['chrome 80', 'ie 11']
   */
  targets?: string[];
};

const defaultOptions: StyleLoaderOptions = {
  targets: [],
};

function bun_style_resolver(text: string) {
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
    const resolvedPath = import.meta.resolve(relPath);
    newText = newText.replace(replaceRegexp, `"${resolvedPath}"`);
  }
  return newText;

}

export default function styleLoader(options: StyleLoaderOptions = {}): BunPlugin {
  const opts = { ...defaultOptions, ...options };

  return {
    name: 'style-loader',
    async setup(build) {
      const [sass, fs] = await Promise.all([
        import('sass'),
        import('fs'),
      ]);
      build.onResolve({ filter: /bun-style-loader-resolver/ }, (args) => {
        console.log(args);
        return {
          path: "bun-style-loader-resolver",
          namespace: "bun-style-loader-resolver",
        };
      });

      build.onLoad({ filter: /./, namespace: "bun-style-loader-resolver" }, (args) => {
        return {
          contents: `
            export default ${bun_style_resolver.toString()};
          `,
          loader: 'js',
        }
      });
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const contents = fs.readFileSync(args.path, 'utf8');
        const isCssModule = args.path.endsWith('.module.css');

        return compileCSS(contents, args.path, {
          cssModules: isCssModule,
          targets: opts.targets,
        });
      });

      build.onLoad({ filter: /\.scss$/ }, (args) => {
        const result = sass.compile(args.path);
        return compileCSS(result.css, args.path, {
          targets: opts.targets,
        });
      });
    },
  };
}
