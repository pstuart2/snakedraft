Template.CustomTicket.events = {
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				days = $("#days"),
				hours = $("#hours"),
				desc = $("#description"),
				hourEstimate = parseInt(hours.val()),
				//dayEstimate,
				hoursInDay = parseInt(Configs.findOne({Name: "HoursPerDay"}).Value);

		if (!hourEstimate) { hourEstimate = 0; }
		hourEstimate += parseInt(days.val()) * parseInt(hoursInDay);
		//dayEstimate = parseInt(hourEstimate / hoursInDay);
		//hourEstimate = hourEstimate - (dayEstimate * hoursInDay);

		Tickets.insert({
			Id: ticket.val(),
			Title: title.val(),
			//Days: dayEstimate,
			Hours: hourEstimate,
			Description: desc.val()
		});

		ticket.val(null);
		title.val(null);
		days.val(null);
		hours.val(null);
		desc.val(null);
	}
};
