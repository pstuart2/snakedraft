Template.CustomTicket.rendered = function() {
	SessionAmplify.setDefault("editTicketId", null);
};

Template.CustomTicket.Show = function(editId) {
	if (editId) {
		SessionAmplify.set("editTicketId", editId);
		Meteor.flush();
		$("#customTicketModal").modal("show");
	}
};

Template.CustomTicket.Ticket = function() {
	var ticket = Tickets.findOne({_id: SessionAmplify.get("editTicketId")});
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
	if (SessionAmplify.get("editTicketId")) {
		return "Save";
	}

	return "Add";
};

Template.CustomTicket.events = {
	"click button.close-custom-ticket": function() {
		SessionAmplify.set("editTicketId", null);
	},
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				days = $("#custom-ticket-days"),
				hours = $("#custom-ticket-hours"),
				desc = $("#description"),
				qahours = $("#qahours"),
				totalHours, hoursVal, daysVal;

		hoursVal = hours.val();
		if(!hoursVal) { hoursVal = 0; }

		daysVal = days.val();
		if(!daysVal) { daysVal = 0; }

		totalHours = hoursDaysToTotalHours(hoursVal, daysVal);

		if (SessionAmplify.get("editTicketId")) {
			Tickets.update({_id: SessionAmplify.get("editTicketId")}, { $set: {
				Id: ticket.val(),
				Title: title.val(),
				Hours: totalHours,
				QaHours: qahours.val(),
				Description: desc.val()
			}}, {multi: false}, function(error, data) {
				if (error) {
					alertify.error(error.reason);
				} else {
					alertify.success("Ticket was updated.");
				}
			});
		} else {
			Tickets.insert({
				Id: ticket.val(),
				Title: title.val(),
				Hours: totalHours,
				Description: desc.val()
			}, function(error, data) {
				if (error) {
					alertify.error(error.reason);
				} else {
					alertify.success("Ticket was added.");
				}
			});
		}

		Meteor.call("checkHoursVsTicketHours", function(e, d) {
			if (e) {
				alertify.error(e.reason);
			}
		});

		ticket.val(null);
		title.val(null);
		days.val(null);
		hours.val(null);
		desc.val(null);
		qahours.val(null);

		SessionAmplify.set("editTicketId", null);
	}
};
