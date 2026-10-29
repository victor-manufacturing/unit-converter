/*
  Victor Unit Converter – automated tests
  Usage:   node tests.js [path/to/index.html]
  Part A (math) needs only Node.js.
  Part B (user interface) needs jsdom:  npm install jsdom
*/
const fs = require("fs");
const vm = require("vm");

const htmlPath = process.argv[2] || "index.html";
const html = fs.readFileSync(htmlPath, "utf8");

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) { passed++; }
  else { failed++; console.log(`  FAIL  ${name} ${detail}`); }
}
const close = (a, b, rel = 1e-12) => Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b)) * rel;

/* ---------- Load the real math code from index.html ---------- */
const start = html.indexOf("/* ===== Conversion math");
const end = html.indexOf("/* ===== UI =====");
if (start < 0 || end < 0) { console.error("Could not find the math section in " + htmlPath); process.exit(2); }
const ctx = {};
vm.createContext(ctx);
vm.runInContext(html.slice(start, end) +
  "\nthis.M = { QUANTITIES, parseInput, convert, format2, formatN, factorText };", ctx);
const { QUANTITIES, parseInput, convert, format2, formatN } = ctx.M;
const Q = id => QUANTITIES.find(q => q.id === id);
const show = (id, v, from, to) => format2(convert(Q(id), v, from, to));

console.log("Part A – conversion math");

/* A1. Test-plan values, both directions */
const planCases = [
  ["length", 10, "in", "mm", "254.00"],      ["length", 254, "mm", "in", "10.00"],
  ["force", 50, "lbf", "N", "222.41"],       ["force", 222.41, "N", "lbf", "50.00"],
  ["stress", 1000, "psi", "MPa", "6.89"],    ["stress", 6.89, "MPa", "psi", "999.31"],
  ["area", 1, "in²", "mm²", "645.16"],       ["area", 645.16, "mm²", "in²", "1.00"],
  ["energy", 1, "lbf·in", "N·mm", "112.98"], ["energy", 112.98, "N·mm", "lbf·in", "1.00"],
  ["speed", 1, "in/min", "mm/min", "25.40"], ["speed", 25.4, "mm/min", "in/min", "1.00"],
  ["length", 0, "in", "mm", "0.00"],
];
planCases.forEach(([id, v, f, t, exp]) => {
  const got = show(id, v, f, t);
  check(`${v} ${f} -> ${t}`, got === exp, `expected ${exp}, got ${got}`);
});

/* A2. Independent reference values (typed in from published definitions, not from the app) */
const refs = [
  ["force", "kN", "N", 1000], ["force", "kgf", "N", 9.80665], ["force", "kip", "N", 4448.2216152605],
  ["force", "gf", "N", 0.00980665], ["force", "lbf", "kgf", 0.45359237],
  ["length", "ft", "mm", 304.8], ["length", "yd", "mm", 914.4], ["length", "mi", "mm", 1609344],
  ["length", "km", "mm", 1e6], ["length", "µm", "mm", 0.001], ["length", "cm", "mm", 10], ["length", "m", "mm", 1000],
  ["stress", "psi", "MPa", 0.006894757293168], ["stress", "ksi", "MPa", 6.894757293168],
  ["stress", "bar", "MPa", 0.1], ["stress", "kgf/mm²", "MPa", 9.80665], ["stress", "kgf/cm²", "MPa", 0.0980665],
  ["stress", "N/mm²", "MPa", 1], ["stress", "GPa", "MPa", 1000], ["stress", "kPa", "MPa", 0.001], ["stress", "Pa", "MPa", 1e-6],
  ["area", "in²", "mm²", 645.16], ["area", "ft²", "mm²", 92903.04], ["area", "cm²", "mm²", 100], ["area", "m²", "mm²", 1e6],
  ["energy", "lbf·in", "N·mm", 112.9848290276], ["energy", "ft·lbf", "J", 1.3558179483314],
  ["energy", "J", "N·mm", 1000], ["energy", "N·m", "J", 1], ["energy", "kJ", "J", 1000],
  ["energy", "kgf·m", "J", 9.80665], ["energy", "kgf·cm", "N·mm", 98.0665],
  ["speed", "in/min", "mm/min", 25.4], ["speed", "mm/s", "mm/min", 60], ["speed", "m/s", "mm/min", 60000],
  ["speed", "in/s", "mm/min", 1524], ["speed", "ft/min", "mm/min", 304.8], ["speed", "m/min", "mm/min", 1000], ["speed", "cm/min", "mm/min", 10],
];
refs.forEach(([id, f, t, exp]) => {
  const got = convert(Q(id), 1, f, t);
  check(`1 ${f} = ${exp} ${t}`, close(got, exp, 1e-10), `got ${got}`);
});

/* A3. Every unit pair: reverse uses the inverse factor (full-precision round trip) */
let pairs = 0;
QUANTITIES.forEach(q => q.units.forEach(a => q.units.forEach(b => {
  pairs++;
  [123.456, -7.5, 0.001].forEach(v => {
    const back = convert(q, convert(q, v, a.u, b.u), b.u, a.u);
    check(`${q.id} ${a.u}<->${b.u} round trip ${v}`, close(back, v, 1e-12), `got ${back}`);
  });
})));
console.log(`  (round-trip checked on ${pairs} unit pairs)`);

/* A4. Negatives convert symmetrically; zero stays zero */
QUANTITIES.forEach(q => q.units.forEach(a => q.units.forEach(b => {
  check(`${q.id} ${a.u}->${b.u} negative`, convert(q, -5, a.u, b.u) === -convert(q, 5, a.u, b.u));
  check(`${q.id} ${a.u}->${b.u} zero`, format2(convert(q, 0, a.u, b.u)) === "0.00");
})));

/* A5. Display rounding */
[[0, "0.00"], [1.005, "1.01"], [2.675, "2.68"], [1.004999, "1.00"], [-1.005, "-1.01"],
 [-0.004, "0.00"], [-0.005, "-0.01"], [123456789.125, "123456789.13"], [0.1 + 0.2, "0.30"]]
  .forEach(([x, exp]) => check(`format2(${x})`, format2(x) === exp, `got ${format2(x)}`));
check("format2(NaN) is blank", format2(NaN) === "");
check("format2(Infinity) is blank", format2(Infinity) === "");

/* A5b. Selectable decimal places (0-6) */
[[1234.5, 0, "1235"], [-1234.5, 0, "-1235"], [0.04, 0, "0"], [-0.4, 0, "0"], [222.411080763, 1, "222.4"],
 [222.411080763, 3, "222.411"], [6.894757293168, 4, "6.8948"], [6.894757293168, 6, "6.894757"],
 [1.0005, 3, "1.001"], [0, 4, "0.0000"], [0, 0, "0"], [-0.00004, 4, "0.0000"], [112.9848290276, 5, "112.98483"]]
  .forEach(([x, dp, exp]) => check(`formatN(${x}, ${dp})`, formatN(x, dp) === exp, `got ${formatN(x, dp)}`));
for (let dp = 0; dp <= 6; dp++) {
  const s = formatN(convert(Q("force"), 50, "lbf", "N"), dp);
  check(`${dp} decimals gives ${dp} digits after the point`, dp === 0 ? !s.includes(".") : s.split(".")[1].length === dp, s);
}

/* A6. Input parsing */
const P = s => parseInput(s);
[["", "empty"], ["   ", "empty"], ["-", "partial"], [".", "partial"], ["-.", "partial"], ["+", "partial"],
 ["12", "ok"], ["12.5", "ok"], [".5", "ok"], ["5.", "ok"], ["-3.2", "ok"], [" 7 ", "ok"], ["0", "ok"],
 ["abc", "invalid"], ["1,000", "invalid"], ["1,5", "invalid"], ["1.2.3", "invalid"], ["12abc", "invalid"],
 ["Infinity", "invalid"], ["NaN", "invalid"], ["1e5", "invalid"], ["--5", "invalid"], ["9999999999999", "invalid"]]
  .forEach(([s, exp]) => check(`parse "${s}" -> ${exp}`, P(s).state === exp, `got ${P(s).state}`));
check('parse "12.5" value', P("12.5").value === 12.5);

/* A7. Fuzz: no visible NaN/Infinity whatever is typed */
const chars = "0123456789.-+,eE abcxyz∞";
for (let i = 0; i < 5000; i++) {
  let s = ""; const n = 1 + Math.floor(Math.random() * 8);
  for (let j = 0; j < n; j++) s += chars[Math.floor(Math.random() * chars.length)];
  const p = P(s);
  if (p.state === "ok") {
    const out = show("force", p.value, "lbf", "N");
    if (/NaN|Infinity/.test(out)) check(`fuzz "${s}"`, false, out);
  }
}
check("fuzz 5000 random inputs", true);

/* ---------- Part B: user interface (optional, needs jsdom) ---------- */
async function uiTests() {
  let JSDOM;
  try { ({ JSDOM } = require("jsdom")); }
  catch { console.log("\nPart B – skipped (run `npm install jsdom` to enable UI tests)"); return; }
  console.log("\nPart B – user interface");
  const dom = new JSDOM(html, { runScripts: "dangerously" });
  const d = dom.window.document;
  const $ = id => d.getElementById(id);
  const type = (id, v) => { $(id).value = v; $(id).dispatchEvent(new dom.window.Event("input", { bubbles: true })); };
  const pick = (id, u) => { $(id).value = u; $(id).dispatchEvent(new dom.window.Event("change", { bubbles: true })); };

  check("six cards rendered", d.querySelectorAll(".card").length === 6);
  check("default units lbf/N", $("force-a-unit").value === "lbf" && $("force-b-unit").value === "N");
  type("force-a", "50");    check("typing A updates B", $("force-b").value === "222.41", $("force-b").value);
  type("force-b", "1000");  check("typing B updates A", $("force-a").value === "224.81", $("force-a").value);
  check("source field left as typed", $("force-b").value === "1000");
  check("other cards untouched", $("length-a").value === "" && $("length-b").value === "");
  type("force-b", "");      check("blank clears partner", $("force-a").value === "");
  type("force-a", "-");     check("partial input: no error", $("force-msg").textContent === "" && $("force-b").value === "");
  type("force-a", "abc");   check("invalid input: message shown", $("force-msg").textContent !== "" && $("force-b").value === "");
  check("invalid input: aria-invalid set", $("force-a").getAttribute("aria-invalid") === "true");
  type("force-a", "10");    check("error clears on valid input", $("force-msg").textContent === "" && $("force-b").value === "44.48");
  pick("force-b-unit", "kgf");   check("changing unit recalculates", $("force-b").value === "4.54", $("force-b").value);
  check("factor line follows units", /1 lbf .* kgf/.test(d.querySelector("#force-msg ~ .factor").textContent));
  pick("force-a-unit", "N");     check("changing source unit keeps typed number", $("force-a").value === "10" && $("force-b").value === "1.02", $("force-b").value);
  type("length-a", "10"); pick("length-b-unit", "km");
  check("tiny result shows hint", $("length-b").value === "0.00" && /smaller unit/.test($("length-msg").textContent));
  type("energy-a", "0");    check("zero shows 0.00", $("energy-b").value === "0.00");
  check("decimals default to 2", [...d.querySelectorAll('select[id$="-dp"]')].every(s => s.value === "2"));
  type("stress-a", "1000"); pick("stress-dp", "4");
  check("changing decimals re-displays result", $("stress-b").value === "6.8948", $("stress-b").value);
  pick("stress-dp", "0");   check("0 decimals shows whole number", $("stress-b").value === "7", $("stress-b").value);
  check("decimals are per card", $("force-dp").value === "2");
  type("length-a", "10"); pick("length-dp", "6");
  check("more decimals reveal tiny result", $("length-b").value === "0.000254" && $("length-msg").textContent === "", $("length-b").value);
  d.getElementById("clearAll").click();
  check("clear all keeps chosen decimals", $("stress-dp").value === "0");
  check("clear all empties every field", [...d.querySelectorAll(".card input")].every(i => i.value === ""));
  check("clear all keeps chosen units", $("force-b-unit").value === "kgf");
  check("no NaN/Infinity anywhere on page", !/NaN|Infinity/.test(d.body.textContent));
  check("every input has an accessible name", [...d.querySelectorAll(".card input")].every(i => i.getAttribute("aria-label")));
  check("decimal keypad on mobile", [...d.querySelectorAll(".card input")].every(i => i.getAttribute("inputmode") === "decimal"));
}

uiTests().then(() => {
  console.log(`\n${failed === 0 ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
});
