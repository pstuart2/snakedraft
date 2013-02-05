Meteor.subscribe("Tickets");

Template.Tickets.AvailableTicketArr = function() {
	return Tickets.find({AssignedUserId: {$exists: false}}, {sort: {Id: 1}});
};

Template.Tickets.MyTicketArr = function() {
	var selectedUserId = Session.get('selectedUserId');
	if(!selectedUserId) { selectedUserId = Meteor.userId(); }
	return Tickets.find({AssignedUserId: selectedUserId}, {sort: {Id: 1}});
};

Template.Tickets.userSelected = function() {
	return !Session.equals('selectedUserId', null);
};

Template.Tickets.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.Tickets.canChoose = function (hours) {
	var user = Meteor.users.findOne({_id: Meteor.userId()});
	return (parseInt(hours) <= user.profile.totalHoursAvailable)
};

Template.Tickets.events = {
	"click button.take-ticket": function(e) {
		e.preventDefault();

		Meteor.call("takeTicket", Meteor.userId(), this._id);
	}
};
