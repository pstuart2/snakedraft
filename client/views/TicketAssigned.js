Meteor.subscribe("users");
Meteor.subscribe("Tickets");
Meteor.subscribe("Configs");

Template.TicketAssigned.isAdmin = function() {
	return imaAdmin();
};

Template.TicketAssigned.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.TicketAssigned.assignedUsername = function() {
	return Meteor.users.findOne({_id: this.AssignedUserId}).username;
};

Template.TicketAssigned.canUnassign = function() {
	return imaAdmin();
};

Template.TicketAssigned.JiraLinkUrl = function() {
	return Configs.findOne({Name: "JiraLinkUrl"}).Value;
};

Template.TicketAssigned.events = {
	"click button.unassign-ticket": function(e) {
		var ticketId = this.Id;
		unassignHoursFromUser(this.AssignedUserId, this.Hours);

		Tickets.update({_id: this._id},
				{$unset: {AssignedUserId: 1}},
				{multi: false}, function(e, d) {
					if (e) {
						alertify.error(e.reason);
					} else {
						alertify.success("Ticket " + ticketId + " was unassigned.");
					}
				});
	},
	"click button.delete-ticket": function() {
		deleteTicket(this._id);
	},
	"click button.edit-ticket": function() {
		if (!Meteor.user().profile.isAdmin) {
			return;
		}

		Template.CustomTicket.Show(this._id);
	}
};
