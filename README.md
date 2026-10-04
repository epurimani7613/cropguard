# CropGuard TinyML — Edge Health Diagnostics

React + TypeScript + Vite dashboard for an STM32F411 TinyML crop-disease classifier
running Edge Impulse inference on-device, with a live Web Serial link to the board.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build
npm run test       # parser + line-splitter checks (23 assertions)
npm run preview    # serve the production build on :4173
```

## Serial input is dual-mode

`src/lib/parser.ts` accepts either wire format, auto-detecting per line.

**JSON stream** — atomic, carries timings and the full score set:

```json
{"class":"Healthy","confidence":0.948,"dsp_time":3,"nn_time":11,
 "scores":{"Early_Blight":0.052,"Healthy":0.948,"Late_Blight":0.0}}
```

**Raw Edge Impulse logs** — scores and timings arrive on separate lines and are
accumulated into one frame:

```
[DSP] timing: 3ms
[NN] timing: 11ms
Predictions: Healthy: 0.9482, Early_Blight: 0.0518
```

`src/lib/line-splitter.ts` buffers partial lines across chunk boundaries, which is
the failure mode that silently corrupts frames on a real UART link — there is a
test that splits a JSON frame mid-token every 5 characters and asserts it still
parses.

When a frame names only a winner and no score set, the residual probability is
distributed across the other labels (weighted) so the breakdown still sums to 1
rather than showing a lone 94.8%.

UART writes (`Ping`, `Run once`, `Stream on/off`, `Status`) are gated on an open
port and release the writer lock in `finally` so the port still closes cleanly.

## Sub-threshold frames emit no treatment guidance

The Edge Impulse threshold is 0.60. Below it, the top class is not a finding —
it is the least-wrong of three options. Emitting "Action required: Late Blight —
spray now" on a 58% reading would tell a grower to treat a crop on evidence the
firmware itself rejects, so a sub-threshold frame renders as **Inconclusive** with
a muted ring and no agronomy panels at all. Verified live at 58% (withheld) and
83% (full verdict).

## The model is not what the brief assumed

The brief specified four classes (`Healthy`, `Target_Spot`, `Late_Blight`,
`Yellow_Leaf_Curl`). The model actually deployed on this machine is a **3-class
potato model**. Read straight out of the generated Edge Impulse headers:

```c
// model-parameters/model_variables.h
const char* ei_classifier_inferencing_categories_1111905_1[] =
  { "Early_Blight", "Healthy", "Late_Blight" };
```

`Yellow_Leaf_Curl` does exist in your source dataset, but as a **tomato** disease
(`Tomato___Tomato_Yellow_Leaf_Curl_Virus`, 2,740 images), not a potato class, so
the current model cannot emit it. It is present in `src/data/classes.ts` so the UI
renders it the moment you retrain onto it, but it is deliberately excluded from
`CLASS_ORDER` so it stays out of the breakdown chart until a device actually
reports it.

Other facts taken from the firmware image rather than invented:

| Property | Value | Source |
|---|---|---|
| Input | 96 × 96 RGB → int8 | `EI_CLASSIFIER_INPUT_WIDTH/HEIGHT` |
| Tensor arena | 126 016 B (123.1 KB) | `EI_CLASSIFIER_TFLITE_LARGEST_ARENA_SIZE` |
| Classification threshold | 0.60 | `EI_CLASSIFIER_THRESHOLD` |
| Runtime | EON-compiled TFLite Micro / CMSIS-NN | `EI_CLASSIFIER_COMPILED 1` |
| Flash / SRAM | 512 KB / 128 KB | `STM32F411CEUX_FLASH.ld` |
| Project | 1111905 · deploy v2 | `model_metadata.h` |

**The dashboard renders whatever labels the device reports.** `src/data/classes.ts`
maps label → agronomy content and degrades gracefully to an "unmapped" entry for
labels it does not know, so retraining on more crops needs a data edit, not a code
change. If you want the four classes from the brief, retrain the model first — then
add the rows.

## Simulator vs. real hardware

Simulation is **opt-in** via the toggle and three preset buttons (Healthy, Late
Blight, Random), streaming a JSON frame every 2 s. The simulator round-trips each
frame through the real JSON wire format and the real parser, so it exercises the
same code path a board would rather than bypassing it.

**Simulated values are labelled as such in the UI** — the banner, the diagnosis card
subtitle, and the console all distinguish `simulated` from `serial`. Nothing
pretends to be a measurement. Simulated controls disable themselves when a real
device is attached, since hardware wins.

The live stream stops when you switch to static feature vector mode, so a triggered
preset holds its verdict instead of being overwritten by the next frame.

## Web Serial

`src/lib/serial.ts` declares the narrow slice of the Web Serial API used
(TypeScript's DOM lib omits it entirely). Chrome/Edge/Opera only, over `localhost`
or `https`. In Firefox/Safari the dashboard detects this and says so rather than
failing silently.

The firmware's log grammar is also accepted, with scores and timings accumulated
across lines into a single frame:

```
[DSP] Signal length: 9216
[DSP] squash 96x96 · RGB → int8 · overflow 0.0%
[NN] EON int8 · arena 123.1 KB / 126.0 KB · heap 53.0%
[INFO] run_classifier() completed in 13ms
[PREDICTION] Class: Late_Blight (0.9156)
```

If a cycle arrives with labels missing, it commits anyway rather than silently
ranking on a subset.

## Layout

Monitor surface: the verdict and the class scores dominate; controls sit in a right
rail; the console spans full width at the bottom. Twelve-column grid at `xl`,
stacking to one column on tablet/phone with no horizontal overflow (verified at
820 / 1024 / 1280 / 1680).

```
src/
  data/         labels → agronomy lookup, device constants, test presets
  lib/          serial transport, log parser, formatters, theme
  state/        simulator (drift + softmax) and the useCropGuard store
  components/   diagnosis card, score breakdown, telemetry, console, simulation
    ui/         button, card, accordion, meter, select, switch, stat
```

## Accessibility

Every text/background pair in both themes was measured against WCAG AA (4.5:1 for
body text, 3:1 for large) — 0 failures. The console timestamps were the one real
violation at first pass (2.61:1) and were corrected.

`prefers-reduced-motion` disables the pulse, sheen, and transition animations.

## Notes

- Chemical control rates are typical label ranges with a registration/PHI caveat,
  not a prescription. Confirm locally before applying.
- The model is class-level only — no segmentation — so lesion *extent* is inferred
  from confidence, not measured. The UI states this next to the results.
- `npm run build` warns the bundle exceeds 500 KB, driven by Recharts. Code-split
  the analytics charts if that matters for your deployment.