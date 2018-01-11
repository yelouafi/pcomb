import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify";

export default {
  entry: "src/index.js",
  dest: "dist/pcomb.min.js",
  format: "umd",
  moduleName: "pcomb",
  sourceMap: "dist/pcomb.min.map",
  plugins: [
    babel({
      presets: [["env", { modules: false }]],
      exclude: "node_modules/**"
    }),
    uglify()
  ]
};
