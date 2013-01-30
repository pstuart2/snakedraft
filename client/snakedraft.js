// Added outside the "if" statement because it is for both the client and server.
var Tickets = new Meteor.Collection("Tickets");

if (Meteor.isClient) {

	Template.TmplTickets.TicketArr = function() {
		return Tickets.find({}, {sort: {Id: 1}});
	};

	Template.TmplTickets.events = {
		"click .ticket": function() {
			alert("You just got ticket: " + this.Id);
		}
	};
}
