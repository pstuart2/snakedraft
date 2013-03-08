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


		// Remove all tickets.
		Tickets.remove({});
		// Remove all messages.
		Messages.remove({});
		UserMessages.remove({});

		Drafts.update({}, {$set: {sprintHours: sprintHours}}, {multi: false});

		Meteor.users.update({'profile.isScrumMaster': false},
				{
					$set: {
						'profile.hoursAvailable': sprintHours,
						'profile.hoursLeft': sprintHours,
						'profile.hoursAssigned': 0
					}
				}, {multi: true});

		Meteor.call("checkHoursVsTicketHours", function(e, d) {
			if (e) {
				alertify.error(e.reason);
			}
		});
	}
};
