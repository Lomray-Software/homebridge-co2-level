<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-co2-level

[![npm](https://img.shields.io/npm/v/@lomray/homebridge-co2-level.svg)](https://www.npmjs.com/package/@lomray/homebridge-co2-level) [![npm](https://img.shields.io/npm/dt/@lomray/homebridge-co2-level.svg)](https://www.npmjs.com/package/@lomray/homebridge-co2-level)

</span>

## Description

This plugin shows a CO2 air quality accessory that you can switch to the "detected" state when the level reaches a threshold.

## Fit and installation

`@lomray/homebridge-co2-level@1.0.5` polls an existing HTTP endpoint and exposes a
Homebridge carbon-dioxide accessory. It is not a hardware driver or a certified safety alarm.
A missing response path falls back to zero; do not use the reading as proof that a room is safe.
The published engines are Node `>=12.18.3` and Homebridge `>=1.1.6`; these are historical
minimums, not evidence of testing on current Homebridge or Node releases.

```bash
npm install -g @lomray/homebridge-co2-level@1.0.5
```

Merge this accessory into your existing Homebridge configuration. Replace the example URL
with your sensor endpoint. The example expects the HTTP JSON body `{ "co2": 650 }` in ppm.

```json
{
  "accessories": [
    {
      "accessory": "co2-level",
      "name": "CO2",
      "axiosConfig": {
        "url": "http://sensor.example/co2",
        "method": "GET",
        "timeout": 3000
      },
      "loginUrl": null,
      "valuePath": "data.co2",
      "calculate": "none",
      "interval": 20,
      "threshold": 1000
    }
  ]
}
```

`valuePath` starts at the Axios response, so its first `data` selects the JSON response body.
Use `calculate: "none"` when the endpoint already returns ppm. The `ppm` mode instead
converts an analog value using `round((value - 0.4) * 3125)` above 0.4, or zero otherwise;
it is not a unit label. `percent` divides that converted value by 10000 before rounding.
The detected state is set when the calculated value is greater than or equal to `threshold`.

Set `loginUrl: null` for an endpoint that needs no separate login; the package keeps a
device-specific default URL otherwise. Login is attempted before a reading only after a
`401`, a login-related or unauthorized response body, or `defaultIsNeedLogin: true`.
The plugin starts a polling interval and offers no public dispose method. Stop or restart
Homebridge to end polling. Real device connectivity and HomeKit behavior need hardware testing.

## Documentation checks

Run `node scripts/check-docs.cjs` from this repository. Install dependencies first. The check uses mocked HTTP and Homebridge objects and captures the polling interval without starting it; it does not contact a sensor. Set `DOCS_PACKAGE_DIR` to an unpacked release to test that artifact.

Run `node scripts/test-docs-check.cjs` with the same setup to test the checker itself,
including an example that never settles. This is a local check, not a configured CI job.
