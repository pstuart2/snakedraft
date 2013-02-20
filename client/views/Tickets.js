Meteor.subscribe("users");
Meteor.subscribe("Tickets");

Template.Tickets.rendered = function() {
	var selTab = Session.get('selectedTab');
	if (selTab && $('#myTab a[href="' + selTab + '"]').length > 0) {
		$('#myTab a[href="' + selTab + '"]').tab("show");
	} else {
		Session.set('selectedTab', "#All");
	}
};

Template.Tickets.TicketArr = function() {
	var selTab = Session.get('selectedTab'),
			tickets;

	switch(selTab)
	{
		case "#Assigned":
		{
			tickets = Tickets.find({AssignedUserId: {$exists: true}}, {sort: {Id: 1}});
		} break;

		case "#Available":
		{
			tickets = Tickets.find({AssignedUserId: {$exists: false}}, {sort: {Id: 1}});
		} break;

		case "#UserTickets":
		{
			var selectedUserId = getSelectedUserId();
			if(selectedUserId == null) { return []; }
			tickets = Tickets.find({AssignedUserId: selectedUserId}, {sort: {Id: 1}});
		} break;

		default:
		{
			tickets = Tickets.find({}, {sort: {Id: 1}});
		} break;
	}

	return tickets;
};

Template.Tickets.isAvailable = function() {
	return this.AssignedUserId == null;
};

Template.Tickets.isAdmin = function() {
	return imaAdmin();
};

Template.Tickets.selectedUsername = function() {
	return getSelectedUsername();
};

Template.Tickets.userSelected = function() {
	return getSelectedUserId() != null;
};

Template.Tickets.events({
	"click ul#myTab > li > a": function(e) {
		e.preventDefault();
		var alink = $(e.currentTarget); //.find("a");
		Session.set('selectedTab', alink.attr("href"));
	}
});
