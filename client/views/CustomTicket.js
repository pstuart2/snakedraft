Template.CustomTicket.events = {
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				days = $("#custom-ticket-days"),
				hours = $("#custom-ticket-hours"),
				desc = $("#description"),
				totalHours, hoursVal, daysVal;

		hoursVal = hours.val();
		if(!hoursVal) { hoursVal = 0; }

		daysVal = days.val();
		if(!daysVal) { daysVal = 0; }

		totalHours = hoursDaysToTotalHours(hoursVal, daysVal);

		Tickets.insert({
			Id: ticket.val(),
			Title: title.val(),
			//Days: dayEstimate,
			Hours: totalHours,
			Description: desc.val()
		});

		ticket.val(null);
		title.val(null);
		days.val(null);
		hours.val(null);
		desc.val(null);
	}
};
