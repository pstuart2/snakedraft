// This is executed in both client and server
function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var __hoursPerDay = 0;
function hoursPerDay()
{
	if(__hoursPerDay == 0) {
		var hpd = Configs.findOne({Name: "HoursPerDay"});
		if(hpd) {
			__hoursPerDay = parseInt(hpd.Value);
		}
	}
	return __hoursPerDay;
}

function hoursToDaysHours(totalHours) {
	var hoursInDay = hoursPerDay(),
			result = {days: 0, hours: 0};

	result.hours = parseInt(totalHours);
	result.days = parseInt(result.hours / hoursInDay);
	result.hours = result.hours - (result.days * hoursInDay);

	return result;
}

function hoursDaysToTotalHours(hours, days) {
	var hoursInDay = hoursPerDay();
	return (parseInt(hours) + (parseInt(days) * hoursInDay));
}

function formatTotalHours(totalHours) {
	var result = hoursToDaysHours(totalHours);
	return result.days + "d " + result.hours + "h";
}
