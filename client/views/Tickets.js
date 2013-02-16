Meteor.subscribe("users");
Meteor.subscribe("Tickets");

Template.Tickets.rendered = function() {
	var selTab = Session.get('selectedTab');
	if (selTab && $('#myTab a[href="' + selTab + '"]').length > 0) {
		$('#myTab a[href="' + selTab + '"]').tab("show");
	} else {
		$('#myTab a[href="#All"]').tab("show");
	}
};

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

Template.Tickets.events({
	"click ul#myTab > li": function(e) {
		var alink = $(e.currentTarget).find("a");
		Session.set('selectedTab', alink.attr("href"));
	}
});
