import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require: (n) =>
        Object.hasOwn(dependencies, n) ? dependencies[n] : require(n),
      URL,
      TextDecoder,
      Date,
      process,
    },
    { filename: file },
  );
  return module.exports;
}
const shared = load("src/features/expertiza/shared.ts");
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  carol = "33333333-3333-4333-8333-333333333333";
test("commands bound content and reject paths, invalid IDs and forged role fields", () => {
  for (const command of [
    { action: "answer", questionId: "../victim", body: "x" },
    { action: "message", recipientId: "../victim", body: "x" },
    { action: "question", title: "x".repeat(141), body: "", communityId: null },
    { action: "review", teacherId: "x", stars: 6, body: "good" },
    { action: "profile", name: "", school: "", subject: "" },
  ])
    assert.equal(shared.parseCommand(command), null);
  const value = shared.parseCommand({
    action: "profile",
    name: " Name ",
    school: "",
    subject: "",
    id: bob,
    role: "administrator",
  });
  assert.equal(value.name, "Name");
  assert.equal(value.id, undefined);
  assert.equal(value.role, undefined);
  assert.equal(shared.requiresAdmin("moderate"), true);
  assert.equal(shared.requiresAdmin("community"), true);
  assert.equal(shared.requiresAdmin("answer"), false);
});
test("conversation keys are canonical and require distinct UUID participants", () => {
  assert.equal(
    shared.conversationPath(alice, bob),
    shared.conversationPath(bob, alice),
  );
  assert.notEqual(
    shared.conversationPath(alice, bob),
    shared.conversationPath(alice, carol),
  );
  assert.throws(() => shared.conversationPath(alice, "../x"));
  assert.throws(() => shared.conversationPath(alice, alice));
});
const initial = {
  me: { id: alice, name: "Elev", role: "elev" },
  contacts: [
    { id: bob, name: "Profesor", role: "profesor" },
    { id: carol, name: "Administrator", role: "administrator" },
  ],
  communities: [{ id: "group", joined: false }],
  questions: [
    { id: "q", title: "Question", body: "details", communityId: null },
    { id: "private-group-q", communityId: "group" },
  ],
  teachers: [{ id: "teacher" }],
  archived: [],
};
function route(account, repo = {}, askMaria = async () => "AI answer") {
  return load("src/app/api/expertiza/[...path]/route.ts", {
    "@/lib/auth": { getAccount: async () => account },
    "@/features/expertiza/shared": shared,
    "@/features/expertiza/server/repository": {
      board: async () => structuredClone(initial),
      contacts: async () => initial.contacts,
      ...repo,
    },
    "@/features/expertiza/server/ai": { askMaria },
  });
}
const account = { id: alice, name: "Elev", role: "elev" };
function request(api, command, path = "actions", headers = {}) {
  const method = command ? "POST" : "GET";
  return api[method](
    new Request(`http://localhost/api/expertiza/${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      ...(command ? { body: JSON.stringify(command) } : {}),
    }),
    { params: Promise.resolve({ path: [path.split("?")[0]] }) },
  );
}
test("guest, cross-origin, nonadmin and unjoined writes fail before persistence", async () => {
  let writes = 0;
  const repo = { put: async () => writes++ };
  assert.equal((await request(route(null, repo), null, "state")).status, 401);
  const api = route(account, repo);
  assert.equal(
    (await request(api, { action: "rule", title: "x", body: "x" })).status,
    403,
  );
  assert.equal(
    (
      await request(
        api,
        { action: "profile", name: "x", school: "", subject: "" },
        "actions",
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(api, {
        action: "answer",
        questionId: "private-group-q",
        body: "x",
      })
    ).status,
    403,
  );
  assert.equal(writes, 0);
});
test("profile and reply ownership come from authenticated account", async () => {
  const written = [];
  const api = route(account, {
    put: async (path, value) => written.push({ path, value }),
  });
  await request(api, {
    action: "profile",
    name: "New",
    school: "",
    subject: "",
    id: bob,
    role: "administrator",
  });
  assert.equal(written[0].path, `profiles/${alice}.json`);
  assert.equal(written[0].value.role, undefined);
  await request(api, {
    action: "answer",
    questionId: "q",
    body: "Hello",
    authorId: bob,
    role: "administrator",
  });
  assert.equal(written[1].value.authorId, alice);
  assert.equal(written[1].value.role, "elev");
});
test("DM ignores forged sender and conversation identifiers; excludes other pairs", async () => {
  const calls = [];
  const api = route(account, {
    sendMessage: async (...args) => calls.push(args),
    messageHistory: async (...args) => {
      calls.push(args);
      return [];
    },
  });
  assert.equal(
    (
      await request(api, {
        action: "message",
        recipientId: bob,
        body: "Hello",
        senderId: carol,
        conversationId: `${bob}_${carol}`,
      })
    ).status,
    200,
  );
  assert.deepEqual(calls[0], [alice, bob, "Hello"]);
  await request(api, null, `messages?with=${bob}&senderId=${carol}`);
  assert.deepEqual(calls[1], [alice, bob]);
  assert.equal(
    (await request(api, null, "messages?with=../victim")).status,
    400,
  );
  assert.equal(
    (await request(api, { action: "message", recipientId: alice, body: "x" }))
      .status,
    404,
  );
});
test("storage/provider errors are controlled and AI persists only real successful output", async () => {
  const api = route(account, {
    put: async () => {
      throw new Error("secret provider details");
    },
  });
  const failed = await request(api, {
    action: "profile",
    name: "x",
    school: "",
    subject: "",
  });
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /secret/);
  const written = [];
  let input;
  const working = route(
    account,
    { put: async (path, value) => written.push(value) },
    async (q) => {
      input = q;
      return "Actual output";
    },
  );
  assert.equal(
    (await request(working, { action: "ai", questionId: "q" })).status,
    200,
  );
  assert.equal(input.id, "q");
  assert.equal(written[0].role, "ai");
  assert.equal(written[0].authorId, null);
  assert.equal(written[0].provider, "openai");
});
test("Maria request is explicit, bounded, stateless and excludes private data", async () => {
  let payload;
  class OpenAI {
    constructor(options) {
      assert.equal(options.maxRetries, 0);
      assert.equal(options.timeout, 20000);
    }
    responses = {
      create: async (value) => {
        payload = value;
        return { status: "completed", output_text: "Useful answer" };
      },
    };
  }
  const old = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only";
  try {
    const { askMaria } = load("src/features/expertiza/server/ai.ts", {
      "server-only": {},
      openai: OpenAI,
    });
    assert.equal(
      await askMaria({
        title: "A",
        body: "B",
        privateMessages: "secret",
        email: "private",
      }),
      "Useful answer",
    );
    assert.equal(payload.store, false);
    assert.ok(payload.max_output_tokens <= 1000);
    assert.equal(
      payload.input,
      JSON.stringify({ question: "A", details: "B" }),
    );
  } finally {
    if (old === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = old;
  }
});
