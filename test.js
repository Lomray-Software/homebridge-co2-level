const axios       = require('axios');
const _       = require('lodash');

(() => {
	// axios
	// 	.get("http://192.168.100.53/?page=devlogin&devpass=157205447", { timeout: 2000 })
	// 	.then(() => console.log('Login success.'))
	// 	.catch(e => console.error(e));

	axios
		.request({
			url:     'http://192.168.100.53/?page=getwdata',
			method:  'GET',
			timeout: 3000,
		})
		.then(response => {
			const valuePath = 'data.ADC.value';
			const co2RawValue = Number(_.get(response, 'data.data.ADC.value', 0));

			console.log(response, co2RawValue, response.status);
		})
		.catch(e => console.log(e))
})()
