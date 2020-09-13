const axios       = require('axios');
const packageJson = require('./package.json');
const _           = require('lodash');

let Service, Characteristic;

/**
 * @param {API} homebridge
 */
module.exports = function (homebridge) {
	Service        = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-co2-level', 'co2-level', CO2Accessory);
};

const CALCULATE = {
	PPM:     'ppm',
	PERCENT: 'percent',
	NONE:    'none',
};

/**
 * @param {function} log
 * @param {Object} conf
 * @constructor
 */
function CO2Accessory(log, conf) {
	const defaultConfig = {
		axiosConfig: {
			url:     'http://example.loc/?page=getwdata',
			method:  'GET',
			timeout: 3000,
		},
		loginUrl:    'http://example.loc/?page=devlogin&devpass=pass', // not required
		valuePath:   'data.ADC.value',
		calculate:   CALCULATE.PPM, // ppm,percent,none

		interval:  20, // in seconds
		threshold: 1000, // in ppm
	};

	this.config        = _.merge(defaultConfig, conf);
	this.log           = log;
	this.name          = this.config.name;
	this.isCO2Detected = 0;

	this.service = new Service.CarbonDioxideSensor(this.name);

	this.service
		.getCharacteristic(Characteristic.CarbonDioxideDetected)
		.on('get', this.getCo2Detected.bind(this));

	this.service
		.getCharacteristic(Characteristic.CarbonDioxideLevel)
		.on('get', this.getCo2Level.bind(this));

	this.informationService = new Service.AccessoryInformation();
	this.informationService
		.setCharacteristic(Characteristic.Manufacturer, 'Homebridge')
		.setCharacteristic(Characteristic.Model, 'CO2_Level')
		.setCharacteristic(Characteristic.SerialNumber, packageJson.version);

	// Set init CO2 value
	this.getCo2Level((err, value) => this
		.service
		.setCharacteristic(Characteristic.CarbonDioxideLevel, value),
	);
	// Set init CO2 threshold
	this.service.setCharacteristic(Characteristic.CarbonDioxideDetected, this.isCO2Detected);

	// Update CO2 value by interval
	setInterval(() => {
		this.getCo2Level((err, value) => this
			.service
			.getCharacteristic(Characteristic.CarbonDioxideLevel)
			.updateValue(value),
		);
	}, this.config.interval * 1000);
}

/**
 * @name CO2Accessory#getCo2Level
 * @function
 */
CO2Accessory.prototype.getCo2Level = function (callback) {
	// Login
	if (this.config.loginUrl) {
		axios
			.get(this.config.loginUrl, { timeout: this.config.axiosConfig.timeout })
			.then(() => this.log('Login success.'))
			.catch(e => this.log(`Login failed: ${e.message}`));
	}

	// Get data
	axios
		.request(this.config.axiosConfig)
		.then(response => {
			const co2RawValue = Number(_.get(response, this.config.valuePath, 0));
			let co2Value;

			switch (this.config.calculate) {
				case CALCULATE.PPM:
					co2Value = co2RawValue > 0.4 ? (co2RawValue - 0.4) * 3125 : 0;
					break;
				case CALCULATE.PERCENT:
					co2Value = co2RawValue > 0.4 ? ((co2RawValue - 0.4) * 3125) / 10000 : 0;
					break;
				default:
					co2Value = co2RawValue;
			}

			this.log(`Obtained CO2 value: ${co2Value}. Raw: ${co2RawValue}.`);

			this.setCo2Detected(co2Value);

			callback(null, co2Value);
		})
		.catch(e => {
			this.log(`Error obtain CO2 value: ${e.message}.`);
			callback(e.message);
		});
};

/**
 * @name CO2Accessory#setCo2Detected
 * @function
 */
CO2Accessory.prototype.setCo2Detected = function (value) {
	if (value >= this.config.threshold) {
		this.isCO2Detected = 1;
	} else {
		this.isCO2Detected = 0;
	}
	this.service.getCharacteristic(Characteristic.CarbonDioxideDetected).updateValue(this.isCO2Detected);
};

/**
 * @name CO2Accessory#getCo2Detected
 * @function
 */
CO2Accessory.prototype.getCo2Detected = function (callback) {
	this.log(`CO2 detected: ${this.isCO2Detected}.`);
	callback(null, this.isCO2Detected);
};

/**
 * @name CO2Accessory#getServices
 * @function
 */
CO2Accessory.prototype.getServices = function () {
	return [this.service, this.informationService];
};
