var Configs = new Meteor.Collection("Configs");
var Tickets = new Meteor.Collection("Tickets");

Template.TmplTickets.TicketArr = function() {
	return Tickets.find({}, {sort: {Id: 1}});
};

Template.TmplTickets.events = {
	"click .ticket": function() {
		alert("You just got ticket: " + this.Id);
	}
};
