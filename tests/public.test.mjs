import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const PublicLanding = Symbol("PublicLanding");
const MentorApp = Symbol("MentorApp");
function page(file, account) {
  const dependencies = {
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "@/components/public-landing": { PublicLanding },
    "@/components/mentor-app": { MentorApp },
    "@/lib/auth": { getAccount: async () => account },
  };
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  );
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module,
    exports: module.exports,
    require: (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return module.exports.default;
}

test("anonymous root shows only public content; verified accounts retain their existing workspace", async () => {
  const guest = await page("src/app/page.tsx", null)();
  assert.equal(guest.type, PublicLanding);
  assert.equal(guest.props.account, undefined);
  for (const role of ["administrator", "profesor", "elev"]) {
    const account = { id: "verified-account", name: role, role };
    const workspace = await page("src/app/page.tsx", account)();
    assert.equal(workspace.type, MentorApp);
    assert.equal(workspace.props.account, account);
  }
});

test("the dedicated public page can render without checking an account", async () => {
  const result = await page("src/app/despre/page.tsx", null)();
  assert.equal(result.type, PublicLanding);
  assert.equal(result.props.account, undefined);
});
