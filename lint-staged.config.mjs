import { relative } from "node:path";

const ESLINT_SOURCES = /^(app|lib|components)\/.*\.tsx?$/;

function quote(file) {
  return `"${file.replace(/"/g, '\\"')}"`;
}

// One task list per file set keeps ESLint and Prettier from editing the same
// file concurrently, which lint-staged does for overlapping globs.
const config = {
  "*": (files) => {
    const lintable = files.filter((file) =>
      ESLINT_SOURCES.test(relative(process.cwd(), file).split("\\").join("/"))
    );
    const tasks = [];
    if (lintable.length > 0) {
      tasks.push(`eslint --fix ${lintable.map(quote).join(" ")}`);
    }
    tasks.push(
      `prettier --write --ignore-unknown ${files.map(quote).join(" ")}`
    );
    return tasks;
  },
};

export default config;
