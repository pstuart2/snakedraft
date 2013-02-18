Meteor.subscribe("Tickets");

Session.set("editTicketId", null);

Template.CustomTicket.Show = function(editId) {
	if (editId) {
		Session.set("editTicketId", editId);
		Meteor.flush();
		$("#customTicketModal").modal("show");
	}
};

Template.CustomTicket.Ticket = function() {
	var ticket = Tickets.findOne({_id: Session.get("editTicketId")});
	if (!ticket) { ticket = {}; }
	else {
		ticket.time = hoursToDaysHours(ticket.Hours);
	}
	return ticket;
};

/**
 *
 * @return {String}
 * @constructor
 */
Template.CustomTicket.AddOrSave = function() {
	if (Session.get("editTicketId")) {
		return "Save";
	}

	return "Add";
};

Template.CustomTicket.events = {
	"click button.close-custom-ticket": function() {
		Session.set("editTicketId", null);
	},
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

		if (Session.get("editTicketId")) {
			Tickets.update({_id: Session.get("editTicketId")}, {$set: {
				Id: ticket.val(),
				Title: title.val(),
				Hours: totalHours,
				Description: desc.val()
			}}, {multi: false});
		} else {
			Tickets.insert({
				Id: ticket.val(),
				Title: title.val(),
				Hours: totalHours,
				Description: desc.val()
			});
		}

		ticket.val(null);
		title.val(null);
		days.val(null);
		hours.val(null);
		desc.val(null);

		Session.set("editTicketId", null);
	}
};
