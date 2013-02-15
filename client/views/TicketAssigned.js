Meteor.subscribe("users");
Meteor.subscribe("Tickets");

Template.TicketAssigned.isAdmin = function() {
	return Meteor.user().profile.isAdmin;
};

Template.TicketAssigned.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.TicketAssigned.assignedUsername = function() {
	return Meteor.users.findOne({_id: this.AssignedUserId}).username;
};

Template.TicketAssigned.events = {
	"click button.unassign-ticket": function(e) {
		Meteor.call("unassignTicket", this._id);
	}
};
