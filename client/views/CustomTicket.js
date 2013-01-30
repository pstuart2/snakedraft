Template.CustomTicket.events = {
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				desc = $("#description");

		Tickets.insert({Id: ticket.val(), Title: title.val(), Description: desc.val()});
		$("#addTickets").hide();

		ticket.val(null);
		title.val(null);
		desc.val(null);
	}
};
