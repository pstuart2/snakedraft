Meteor.subscribe("users");
Meteor.subscribe("Tickets");

Template.Tickets.AvailableTicketArr = function() {
	return Tickets.find({AssignedUserId: {$exists: false}}, {sort: {Id: 1}});
};

Template.Tickets.AllTicketsArr = function() {
	return Tickets.find({}, {sort: {Id: 1}});
};

Template.Tickets.AssignedTicketArr = function() {
	return Tickets.find({AssignedUserId: {$exists: true}}, {sort: {Id: 1}});
};

Template.Tickets.MyTicketArr = function() {
	var selectedUserId = Session.get('selectedUserId');
	if(!selectedUserId) { selectedUserId = Meteor.userId(); }
	return Tickets.find({AssignedUserId: selectedUserId}, {sort: {Id: 1}});
};

Template.Tickets.isAvailable = function() {
	return this.AssignedUserId == null;
};

Template.Tickets.isAdmin = function() {
	return Meteor.user().profile.isAdmin;
};

Template.Tickets.selectedUsername = function() {
	return Session.get("selectedUserName");
};

Template.Tickets.canAssign = function() {
	return !Session.equals('selectedUserId', null) && Meteor.user().profile.isAdmin;
};

Template.Tickets.userSelected = function() {
	return !Session.equals('selectedUserId', null);
};
