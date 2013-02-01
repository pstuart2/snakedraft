Meteor.subscribe("Tickets");

Template.Tickets.TicketArr = function() {
	return Tickets.find({}, {sort: {Id: 1}});
};

Template.Tickets.events = {
	"click .ticket": function() {
		alert("You just got ticket: " + this.Id);
	}
};
