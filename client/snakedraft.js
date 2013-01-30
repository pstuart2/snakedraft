var Tickets = new Meteor.Collection("Tickets");

Template.TmplTickets.TicketArr = function() {
	return Tickets.find({}, {sort: {Id: 1}});
};

Template.TmplTickets.events = {
	"click .ticket": function() {
		alert("You just got ticket: " + this.Id);
	}
};

Template.TmplCommandBar.events = {
	"click button.add-custom-ticket": function() {
		$("#addTickets").show();
	},
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
