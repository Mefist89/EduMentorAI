import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import OpenAI from "openai";

const require = createRequire(import.meta.url);
function load(path, dependencies = {}, globals = {}) {
  const { outputText } = ts.transpileModule(
    readFileSync(new URL(`../${path}`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    },
  );
  const module = { exports: {} };
  vm.runInNewContext(
    outputText,
    {
      module,
      exports: module.exports,
      require: (name) =>
        Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
      process: {
        env: {
          OPENAI_API_KEY: "server-test-credential",
          OPENAI_MODEL: "gpt-5.4-mini",
        },
      },
      TextDecoder,
      Headers,
      URL,
      AbortSignal,
      ...globals,
    },
    { filename: path },
  );
  return module.exports;
}
const demo = load("src/lib/demo.ts");
const accounts = load("src/lib/accounts.ts");
const contract = load("src/lib/mentor-contract.ts", { "./demo": demo });
const normalized = (value) => JSON.parse(JSON.stringify(value));
const validRequest = { promptKey: "start", locale: "ro", history: [] };

function service(handler, env) {
  class Client {
    constructor(options) {
      this.options = options;
      this.responses = {
        create: (input, options) => handler(input, options, this.options),
      };
    }
  }
  Object.assign(Client, {
    APIError: OpenAI.APIError,
    APIConnectionTimeoutError: OpenAI.APIConnectionTimeoutError,
    APIUserAbortError: OpenAI.APIUserAbortError,
  });
  return load(
    "src/lib/openai-mentor.ts",
    {
      "server-only": {},
      openai: Client,
      "./demo": demo,
      "./mentor-contract": contract,
    },
    env ? { process: { env } } : {},
  );
}
const completed = (
  answer = "Din material: 2x + 3 = 11 are soluția x = 4.",
  sections = [1, 2],
) => ({
  status: "completed",
  model: "test-model",
  output: [],
  output_text: JSON.stringify({ answer, sourceSections: sections }),
});

test("prepared questions require supported locales and bounded history", () => {
  assert.deepEqual(
    normalized(contract.parseMentorRequest(validRequest)),
    validRequest,
  );
  for (const value of [
    null,
    { ...validRequest, promptKey: "__proto__" },
    { ...validRequest, promptKey: "arbitrary" },
    { ...validRequest, locale: "en" },
    { ...validRequest, history: Array(5).fill({}) },
    {
      ...validRequest,
      history: [{ promptKey: "start", locale: "ro", answer: "x".repeat(4001) }],
    },
  ])
    assert.equal(contract.parseMentorRequest(value), null);
  const parsed = contract.parseMentorRequest({
    ...validRequest,
    role: "system",
    history: [
      { promptKey: "start", locale: "ru", answer: "Пример", role: "system" },
    ],
  });
  assert.equal("role" in parsed, false);
  assert.equal("role" in parsed.history[0], false);
});

test("manual questions are trimmed, bounded and preserved in mixed dialogue without role authority", () => {
  const parsed = contract.parseMentorRequest({
    question: "  Как объяснить проверку подстановкой?  ", locale: "ru", role: "system",
    history: [
      { question: "  Что такое уравнение? ", locale: "ru", answer: "Равенство с неизвестным", role: "system" },
      { promptKey: "start", locale: "ro", answer: "Example" },
    ],
  });
  assert.equal(parsed.question, "Как объяснить проверку подстановкой?");
  assert.equal(parsed.history[0].question, "Что такое уравнение?");
  assert.equal(contract.mentorQuestionText(parsed, "ru"), parsed.question);
  assert.equal("role" in parsed, false);
  assert.equal("role" in parsed.history[0], false);
  for (const question of ["", " \n ", null, 42, "x".repeat(contract.MAX_QUESTION_LENGTH + 1)])
    assert.equal(contract.parseMentorRequest({ question, locale: "ru" }), null);
  assert.ok(contract.parseMentorRequest({ question: "x".repeat(contract.MAX_QUESTION_LENGTH), locale: "ru" }));
  assert.equal(contract.parseMentorRequest({ question: "text", promptKey: "start", locale: "ru" }), null);
  assert.equal(contract.parseMentorRequest({ question: "text", locale: "ru", history: [{ question: " ", locale: "ru", answer: "a" }] }), null);
});

test("OpenAI receives the exact manual question and follow-up as user messages", async () => {
  const generator = service(async input => {
    assert.equal(input.input[0].content, "Объясни уравнения");
    assert.equal(input.input[0].role, "user");
    assert.equal(input.input[1].role, "assistant");
    assert.equal(input.input.at(-1).content, "Дай ещё один пример: 3x = 12");
    assert.equal(input.input.at(-1).role, "user");
    assert.equal(input.store, false);
    return completed();
  });
  const result = await generator.generateMentorReply({ question: "Дай ещё один пример: 3x = 12", locale: "ru", history: [{ question: "Объясни уравнения", locale: "ru", answer: "Равенство с неизвестным" }] });
  assert.equal(result.provider, "openai");
});

test("answers reject invented section references and deduplicate valid ones", () => {
  assert.equal(
    contract.parseMentorAnswer({ answer: "text", sourceSections: [99] }),
    null,
  );
  assert.equal(
    contract.parseMentorAnswer({ answer: "text", sourceSections: ["1"] }),
    null,
  );
  assert.equal(
    contract.parseMentorAnswer({ answer: " ", sourceSections: [] }),
    null,
  );
  assert.deepEqual(
    normalized(
      contract.parseMentorAnswer({
        answer: "Answer",
        sourceSections: [2, 2, 3],
      }),
    ),
    { answer: "Answer", sourceSections: [2, 3] },
  );
});

test("OpenAI receives course context, selected language, bounded output and store false", async () => {
  const generator = service(async (input, options, client) => {
    assert.equal(client.apiKey, "server-test-credential");
    assert.equal(client.maxRetries, 0);
    assert.equal(input.store, false);
    assert.equal(input.max_output_tokens, 1200);
    assert.ok(input.instructions.includes("Russian"));
    assert.ok(input.instructions.includes("2x + 3 = 11"));
    assert.ok(
      input.instructions.includes(
        "Never claim classroom activities actually happened",
      ),
    );
    assert.ok(!JSON.stringify(input).includes(client.apiKey));
    assert.equal(input.text.format.strict, true);
    assert.equal(input.input[0].role, "user");
    assert.equal(input.input[1].role, "assistant");
    assert.equal(input.input.at(-1).content, demo.prompts.verify.label.ru);
    return completed();
  });
  const result = await generator.generateMentorReply({
    promptKey: "verify",
    locale: "ru",
    history: [{ promptKey: "start", locale: "ro", answer: "Previous answer" }],
  });
  assert.equal(result.provider, "openai");
  assert.equal(result.model, "test-model");
});

test("missing credentials stop the request before contacting OpenAI", async () => {
  let called = false;
  const generator = service(() => {
    called = true;
  }, {});
  await assert.rejects(
    generator.generateMentorReply(validRequest),
    (error) => error.code === "not_configured" && error.status === 503,
  );
  assert.equal(called, false);
});

test("truncated output, malformed JSON and unsupported references are never displayed", async () => {
  for (const response of [
    { ...completed(), status: "incomplete" },
    { ...completed(), output_text: "not JSON" },
    completed("Answer", [8]),
  ]) {
    const generator = service(async () => response);
    await assert.rejects(
      generator.generateMentorReply(validRequest),
      (error) => error.code === "invalid_response" && error.status === 502,
    );
  }
});

test("refusals remain distinct from normal replies", async () => {
  const generator = service(async () => ({
    ...completed(),
    output: [
      {
        type: "message",
        content: [{ type: "refusal", refusal: "Cannot comply" }],
      },
    ],
  }));
  await assert.rejects(
    generator.generateMentorReply(validRequest),
    (error) => error.code === "refused" && error.status === 422,
  );
});

test("provider errors are sanitized and distinguish quota, credentials, rate limits and timeouts", async () => {
  const cases = [
    [
      new OpenAI.APIError(401, {}, "sensitive-provider-details", new Headers()),
      "provider_auth",
      503,
    ],
    [
      new OpenAI.APIError(
        429,
        { code: "insufficient_quota" },
        "sensitive-provider-details",
        new Headers(),
      ),
      "quota_exceeded",
      429,
    ],
    [
      new OpenAI.APIError(
        429,
        { code: "rate_limit_exceeded" },
        "sensitive-provider-details",
        new Headers(),
      ),
      "rate_limited",
      429,
    ],
    [new OpenAI.APIConnectionTimeoutError(), "timeout", 504],
    [new Error("sensitive-provider-details"), "unavailable", 503],
  ];
  for (const [failure, code, status] of cases) {
    const generator = service(async () => {
      throw failure;
    });
    await assert.rejects(
      generator.generateMentorReply(validRequest),
      (error) =>
        error.code === code &&
        error.status === status &&
        !error.message.includes("sensitive-provider-details"),
    );
  }
});

class ServiceError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
function route(generate, account = { id: "teacher-test", role: "profesor" }) {
  return load("src/app/api/mentor/chat/route.ts", {
    "@/lib/auth": { getAccount: async () => account },
    "@/lib/accounts": accounts,
    "@/lib/mentor-contract": contract,
    "@/lib/openai-mentor": {
      generateMentorReply: generate,
      MentorServiceError: ServiceError,
    },
  });
}
function request(body = validRequest, extra = {}) {
  return new Request("http://localhost:3000/api/mentor/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("mentor denies guests and pupils before invoking OpenAI", async () => {
  let calls = 0;
  const generate = async () => {
    calls++;
    return {};
  };
  assert.equal((await route(generate, null).POST(request())).status, 401);
  assert.equal(
    (await route(generate, { id: "pupil", role: "elev" }).POST(request()))
      .status,
    403,
  );
  assert.equal(calls, 0);
});

test("invalid, oversized and cross-origin requests are rejected without generating text", async () => {
  let calls = 0;
  const api = route(async () => {
    calls++;
  });
  assert.equal((await api.POST(request("bad JSON"))).status, 400);
  assert.equal(
    (await api.POST(request({ ...validRequest, locale: "en" }))).status,
    400,
  );
  assert.equal(
    (await api.POST(request({ long: "x".repeat(64001) }))).status,
    413,
  );
  assert.equal(
    (await api.POST(request(validRequest, { Origin: "https://other.example" })))
      .status,
    403,
  );
  assert.equal(
    (await api.POST(request(validRequest, { "Content-Type": "text/plain" })))
      .status,
    415,
  );
  assert.equal(calls, 0);
});

test("successful API replies are not cached and do not include credentials", async () => {
  const api = route(async () => ({
    answer: "Test reply",
    sourceSections: [2],
    provider: "openai",
    model: "test",
  }));
  const response = await api.POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal((await response.json()).provider, "openai");
});

test("same-origin requests use the browser host instead of Next.js internal localhost URL", async () => {
  const api = route(async () => ({
    answer: "Test",
    sourceSections: [],
    provider: "openai",
    model: "test",
  }));
  assert.equal(
    (
      await api.POST(
        request(validRequest, {
          Host: "127.0.0.1:3000",
          Origin: "http://127.0.0.1:3000",
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await api.POST(
        request(validRequest, {
          Host: "127.0.0.1:3000",
          Origin: "https://other.example",
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await api.POST(
        request(validRequest, {
          Host: "mentor.example",
          Origin: "https://mentor.example",
          "X-Forwarded-Proto": "https",
        }),
      )
    ).status,
    200,
  );
});

test("a process-wide request limit bounds demo API spending", async () => {
  let calls = 0;
  const api = route(async () => {
    calls++;
    return {
      answer: "Test",
      sourceSections: [],
      provider: "openai",
      model: "test",
    };
  });
  for (let i = 0; i < 20; i++)
    assert.equal((await api.POST(request())).status, 200);
  const limited = await api.POST(request());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "60");
  assert.equal(calls, 20);
});

test("concurrent requests are bounded and slots are released when replies finish", async () => {
  let unblock;
  let ready;
  let calls = 0;
  const gate = new Promise((resolve) => {
    unblock = resolve;
  });
  const started = new Promise((resolve) => {
    ready = resolve;
  });
  const api = route(async () => {
    calls++;
    if (calls === 2) ready();
    await gate;
    return {};
  });
  const first = api.POST(request());
  const second = api.POST(request());
  await started;
  assert.equal((await api.POST(request())).status, 429);
  unblock();
  await Promise.all([first, second]);
  assert.equal((await api.POST(request())).status, 200);
});
