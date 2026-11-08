import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Catalog, SearchRequest } from "../shared/types";
import {
  availability,
  coverage,
  interpretByDictionary,
  search,
} from "../shared/rank";
import { matchCompetencies } from "../shared/dictionary";

const catalog: Catalog = JSON.parse(
  readFileSync(new URL("../data/catalog.json", import.meta.url), "utf8"),
);
const today = new Date(2026, 10, 8);
const base: SearchRequest = {
  text: "",
  stage: "",
  discipline: "",
  when: "oricand",
  format: "oricare",
  minCredits: 0,
  done: [],
};
const byId = (id: string) => catalog.courses.find((c) => c.id === id)!;

test("dicționarul recunoaște formulări ale profesorilor", () => {
  const ids = matchCompetencies("am elevi cu CES și vreau lucru pe grupe").map(
    (m) => m.id,
  );
  assert.ok(ids.includes("incluziune"));
  assert.ok(ids.includes("colaborare"));
  assert.deepEqual(
    matchCompetencies("imprimarea obiectelor").map((m) => m.id),
    ["steam"],
  );
});

test("disponibilitatea distinge cursul viitor, în desfășurare și încheiat", () => {
  assert.equal(availability(byId("b4"), today).kind, "curand"); // LEGO 16.11.2026
  assert.equal(availability(byId("b47"), today).kind, "incheiat"); // USARB, octombrie
  assert.equal(availability(byId("b20"), today).kind, "la-cerere");
});

test("căutarea STEAM la gimnaziu exclude cursurile pentru primar și pe cele încheiate", () => {
  const interp = interpretByDictionary("vreau STEAM cu robotică", "");
  const res = search(
    catalog,
    { ...base, text: "x", stage: "gl" },
    interp,
    today,
  );
  assert.ok(res.results.length > 3);
  assert.ok(res.results.every((r) => r.availability.kind !== "incheiat"));
  assert.ok(!res.results.some((r) => r.id === "b1")); // scris pentru clase primare
});

test("cursurile urmate deja scad noutatea celor asemănătoare", () => {
  const interp = interpretByDictionary("STEAM", "");
  const before = search(catalog, base, interp, today).results.find(
    (r) => r.id === "b4",
  )!;
  const after = search(
    catalog,
    { ...base, done: ["b2"] },
    interp,
    today,
  ).results.find((r) => r.id === "b4")!;
  assert.equal(after.novelty?.total, 3);
  assert.equal(after.novelty?.fresh, 2);
  assert.ok(
    !search(catalog, { ...base, done: ["b2"] }, interp, today).results.some(
      (r) => r.id === "b2",
    ),
  );
  assert.ok(before.novelty === null);
});

test("o competență fără ofertă produce un gol și sugestii apropiate", () => {
  const interp = interpretByDictionary(
    "sarcini diferențiate pentru grupuri eterogene",
    "",
  );
  const res = search(catalog, base, interp, today);
  assert.ok(
    res.gaps.includes("Diferențierea instruirii") ||
      res.results.some((r) => !r.nearOnly),
  );
});

test("filtrul de credite și formatul online", () => {
  const interp = interpretByDictionary("competențe digitale", "");
  const res = search(
    catalog,
    { ...base, minCredits: 10, format: "online" },
    interp,
    today,
  );
  for (const r of res.results) {
    assert.ok(
      r.credits && /(10|20|26)/.test(r.credits),
      r.credits ?? "fără credite",
    );
    assert.ok(!r.format || r.format.includes("online"));
  }
});

test("harta acoperirii are cele 3 statute", () => {
  const s = { total: 0, topCompetencies: [], withoutResults: 0 };
  const real = coverage(catalog, today, false, s);
  assert.ok(
    !real.rows.some((r) => r.cells.some((c) => c.status === "inexistent")),
  );
  const sim = coverage(catalog, today, true, s);
  assert.ok(
    sim.rows.some((r) => r.cells.some((c) => c.status === "inexistent")),
  );
});
