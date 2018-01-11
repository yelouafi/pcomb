import babel from "rollup-plugin-babel";

export default {
  entry: "src/index.js",
  dest: "dist/pcomb.dev.js",
  format: "umd",
  moduleName: "pcomb",
  sourceMap: "inline",
  plugins: [
    babel({
      presets: [["env", { modules: false }]],
      exclude: "node_modules/**"
    })
  ]
};
