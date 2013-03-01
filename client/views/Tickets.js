Meteor.subscribe("users");
Meteor.subscribe("Tickets");
Meteor.subscribe("Drafts");

Template.Tickets.rendered = function() {
	var selTab = SessionAmplify.get('selectedTab');
	if (selTab && $('#myTab a[href="' + selTab + '"]').length > 0) {
		$('#myTab a[href="' + selTab + '"]').tab("show");
	} else {
		SessionAmplify.set('selectedTab', "#All");
	}
};

Template.Tickets.TicketArr = function() {
	var selTab = SessionAmplify.get('selectedTab'),
			draft,
			tickets;

	switch(selTab)
	{
		case "#Assigned":
		{
			tickets = Tickets.find({AssignedUserId: {$exists: true}}, {sort: {Id: 1}});
		} break;

		case "#Available":
		{
			draft = Drafts.findOne({});
			if (draft && draft.isRunning && draft.forcedTicketSize > 0) {
				tickets = Tickets.find({AssignedUserId: {$exists: false}, Hours: draft.forcedTicketSize}, {sort: {Hours: -1, Id: 1}});
			} else {
				tickets = Tickets.find({AssignedUserId: {$exists: false}}, {sort: {Hours: -1, Id: 1}});
			}
		} break;

		case "#UserTickets":
		{
			var selectedUserId = getSelectedUserId();
			if(selectedUserId == null) { return []; }
			tickets = Tickets.find({AssignedUserId: selectedUserId}, {sort: {Id: 1}});
		} break;

		default:
		{
			draft = Drafts.findOne({});
			if (draft && draft.isRunning && draft.forcedTicketSize > 0) {
				tickets = Tickets.find({AssignedUserId: {$exists: false}, Hours: draft.forcedTicketSize}, {sort: {Hours: -1, Id: 1}});
			} else {
				tickets = Tickets.find({}, {sort: {Hours: -1, Id: 1}});
			}
		} break;
	}

	return tickets;
};

Template.Tickets.ForceTicketMode = function() {
	var draft = Drafts.findOne({});
	if (!draft) { return false; }
	return draft.isRunning &&  draft.forcedTicketSize > 0;
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
		SessionAmplify.set('selectedTab', alink.attr("href"));
	}
});
