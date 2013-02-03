Meteor.subscribe("Tickets");

Template.Tickets.TicketArr = function() {
	return Tickets.find({}, {sort: {Id: 1}});
};

Template.Tickets.canChoose = function (hours) {
	var user = Meteor.users.findOne({_id: Meteor.userId()});
	return (parseInt(hours) <= user.profile.totalHoursAvailable)
};

Template.Tickets.events = {
	"click .ticket": function() {
		alert("You just got ticket: " + this.Id);
	}
};
