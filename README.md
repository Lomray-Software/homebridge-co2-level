<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-co2-level

[![npm](https://img.shields.io/npm/v/@lomray/homebridge-co2-level.svg)](https://www.npmjs.com/package/@lomray/homebridge-co2-level) [![npm](https://img.shields.io/npm/dt/@lomray/homebridge-co2-level.svg)](https://www.npmjs.com/package/@lomray/homebridge-co2-level)

</span>

## Description

This plugin shows a CO2 air quality accessory that you can switch to the "detected" state when the level reaches a threshold.

Example config:
```
"accessories": [
	{
	    "accessory": "co2-level",
		"name": "CO2",
		"axiosConfig": {
			"url":     "http://example.loc", // get CO2 data
			"method":  "GET",
			"timeout": 3000, // request timeout
		},
		"loginUrl":    "http://example.loc/?login=1", // not required. If need login before request CO2 value
		"valuePath":   "data.ADC.value", // Path to obtain value from response
		"calculate":   "ppm", // ppm,percent,none

		"interval":  20, // refresh interval in seconds
		"threshold": 1000, // set alarm detect in ppm or % (depends on `calculate`)
	},
]
```
