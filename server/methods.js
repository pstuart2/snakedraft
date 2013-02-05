var draftTimerInterval = null;

Meteor.methods({
	takeTicket: function (userId, ticketId) {
		var ticket, assignee, currentUser,  hours;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		hours = ticket.Hours;
		assignee = Meteor.users.findOne({_id: userId}, {fields: {username: 1, profile: 1}});
		currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!currentUser.profile.isAdmin && assignee.profile.totalHoursAvailable < ticket.Hours) {
			throw new Meteor.Error(404, "User doesn't have enough hours.");
		}

		Tickets.update({_id: ticketId},
				{$set: {AssignedUserId: userId}},
				{multi: false});

		console.log("Hours: " + hours);
		Meteor.users.update({_id: userId},
				{$inc: {'profile.hoursLeft': -hours, 'profile.hoursAssigned': hours}},
				{multi: false});

		return true;
	},

	resetDatabase: function(sprintHours) {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		console.log("Resetting db");
		console.log("SprintHours: " + sprintHours);

		// Remove all tickets.
		Tickets.remove({});

		Meteor.users.update({'profile.isScrumMaster': false},
				{
					$set: {
						//'profile.isAdmin': false,
						'profile.totalHoursAvailable': sprintHours,
						'profile.hoursLeft': sprintHours,
						'profile.hoursAssigned': 0
					}
				}, {multi: true});
	},

	editUser: function(userId, fields) {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!(currentUser.profile.isAdmin || currentUser._id == userId)) {
			throw new Meteor.Error(404, "You cannot edit this user.");
		}

		console.log("Editing user: " + userId);
		Meteor.users.update({_id: userId},
				{
					$set: fields
				},
				{multi: false});
	},

	startDraft: function() {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!(currentUser.profile.isAdmin || draftTimerInterval != null)) {
			throw new Meteor.Error(404, "You cannot start the draft.");
		}

		DraftTimer = 30;
		draftTimerInterval = Meteor.setInterval(function() {
			console.log(DraftTimer);
			DraftTimer--;
			if (DraftTimer == 0) {
				DraftTimer = 30;
			}
		}, 1000);
	}
});
