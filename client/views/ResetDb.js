Template.ResetDb.events = {
	"click button.yes-reset-db": function() {
		var days = $("#resetDb-days"),
				hours = $("#resetDb-hours"),
				sprintHours = parseInt(hours.val()),
				dayEstimate = parseInt(days.val()),
				hoursInDay = parseInt(Configs.findOne({Name: "HoursPerDay"}).Value);

		if (!sprintHours) { sprintHours = 0; }
		if (!dayEstimate) { dayEstimate = 0; }
		sprintHours += dayEstimate * hoursInDay;
		Meteor.call("resetDatabase", sprintHours);
	}
};
