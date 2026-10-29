# VICTOR Unit Converter

A free, browser-based unit converter for universal testing machine (UTM) users.
Live page: https://victor-manufacturing.github.io/unit-converter/

## What it does
Two-way conversion for six quantities, with selectable units and decimal places (0–6, default 2):

| Quantity | Units |
|---|---|
| Force | N, kN, lbf, kip, kgf, gf |
| Length / extension | µm, mm, cm, m, km, in, ft, yd, mi |
| Strength / stress | Pa, kPa, MPa, N/mm², GPa, bar, psi, ksi, kgf/mm², kgf/cm² |
| Area | mm², cm², m², in², ft² |
| Energy | N·mm, N·m, J, kJ, lbf·in, ft·lbf, kgf·m, kgf·cm |
| Speed | mm/min, mm/s, cm/min, m/min, m/s, in/min, in/s, ft/min |

Exact definitions used: 1 in = 25.4 mm, 1 lbf = 4.4482216152605 N, 1 kgf = 9.80665 N.
Calculations use full precision; only the displayed result is rounded.

## Files
- `index.html`: the whole app (logo, layout and code in one file, no external dependencies).
- `README.md`: this file.

## How to update the live page
1. Run the tests on the new `index.html` first (see below). Only continue if all pass.
2. In this repository, click **Add file → Upload files**, drop the new `index.html`, and click **Commit changes**.
3. Wait 1–2 minutes, then refresh the live page.

## How to test
- **Any device (tablet/phone):** open the test page (`tests.html`), choose `index.html`, and confirm "All … checks passed".
- **PC with Node.js:** `npm install jsdom` (once), then `node tests.js index.html`. Expect "ALL TESTS PASSED".

## Privacy
All calculations run in the visitor's browser. No data is sent, stored or tracked.

## Disclaimer
This is a conversion aid only. It does not connect to or change any testing machine's software, calibration, test method or reported test data.
