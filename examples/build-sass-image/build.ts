import styleLoader from "bun-scss-loader"

await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './dist',
  sourcemap: "inline",
  plugins: [styleLoader({ processUrlImports: true, precompile(src, path) { 
    const a = src.replace(/(url\(['"]?)(\.\.?\/)([^'")]+['"]?\))/g, `$1${import.meta.dir}/$2$3`)
    console.log(src)
    // console.log(path)
    return src 
  } })],
}).then((c) => {
  console.log(c)
});
