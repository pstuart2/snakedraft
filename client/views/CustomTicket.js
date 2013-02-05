Template.CustomTicket.events = {
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				days = $("#days"),
				hours = $("#hours"),
				desc = $("#description"),
				totalHours;

		totalHours = hoursDaysToTotalHours(hours.val(), days.val());

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
