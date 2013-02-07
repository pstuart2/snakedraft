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

	updateConfig: function(id, value) {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		Configs.update(id, {$set: {Value: value}});
		var config = Configs.findOne({_id: id});
		if (config.Name == "SecondsPerChoice") {
			Drafts.update({},
					{$set: {
						turnTime: value,
						currentTime: value
					}
					},
					{multi: false});
		}
	},

	editUser: function(userId, fields) {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}}),
				oldUserRec,
				userCount;

		// Ensure we are allowed to edit.
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "You cannot edit this user.");
		}

		// Get our old user record.
		oldUserRec = Meteor.users.findOne({_id: userId});

		// Get our user count so we do not exceed our draft position.
		userCount = Meteor.users.find({}).count();
		if (userCount < fields['profile.draftPosition']) {
			// Draft position exceeded, change to last place.
			fields['profile.draftPosition'] = userCount;
		}

		// Update our user.
		Meteor.users.update({_id: userId},
				{
					$set: fields
				},
				{multi: false});

		// Check to see if our draft position changed...
		if (oldUserRec.profile.draftPosition != fields['profile.draftPosition']) {
			var pos,
					endPos,
					increment;

			// Determine if we are moving up or moving down.
			if (oldUserRec.profile.draftPosition > fields['profile.draftPosition']) {
				pos = fields['profile.draftPosition'];
				endPos = oldUserRec.profile.draftPosition;
				increment = 1;
			} else {
				pos = oldUserRec.profile.draftPosition;
				endPos = fields['profile.draftPosition'];
				increment = -1;
			}

			// Update the other users draft positions.
			Meteor.users.update({
						'profile.draftPosition': {
							$gte: pos,
							$lte: endPos
						},
						_id: {$ne: userId}
					},
					{$inc: {'profile.draftPosition': increment}},
					{multi: true});
		}
	},

	movePeep: function(id, newPos) {

	},

	randomizeDraftees: function() {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!(currentUser.profile.isAdmin || draftTimerInterval != null)) {
			throw new Meteor.Error(404, "You cannot do that!");
		}

		var peeps = Meteor.users.find({}, {fields: {username: 1, profile: 1}}),
				peepCount = peeps.count();


	},

	startDraft: function() {
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {username: 1, profile: 1}});

		if (!(currentUser.profile.isAdmin || draftTimerInterval != null)) {
			throw new Meteor.Error(404, "You cannot start the draft.");
		}

		var draft = Drafts.findOne({});
		if (draft.isRunning) {
			throw new Meteor.Error(404, "Draft is already running.");
		}

		resetDraft();
		startDraftInterval();
	},
	stopDraft: function() {
		if(draftTimerInterval != null) {
			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
			resetDraft();
		}
	},

	pauseDraft: function() {
		if(draftTimerInterval != null) {
			Drafts.update({},
					{$set: {isPaused: true}},
					{multi: false});

			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
		} else {
			Drafts.update({},
					{$set: {isPaused: false}},
					{multi: false});

			startDraftInterval();
		}
	}
});

function startDraftInterval()
{
	// Don't do multiple starts.
	if (draftTimerInterval != null) { return; }

	draftTimerInterval = Meteor.setInterval(function() {
		var draft = Drafts.findOne({});
		if(draft.currentTime <= 0) {
			Drafts.update({_id: draft._id}, {$set: {currentTime: draft.turnTime, isRunning: true}},
					{multi: false});
		} else {
			Drafts.update({_id: draft._id}, {$inc: {currentTime: -1}, $set: {isRunning: true}}, {multi: false});
		}
	}, 1000);
}

function resetDraft()
{
	var SecondsPerChoice = Configs.findOne({Name: 'SecondsPerChoice'});

	Drafts.update({},
			{$set: {
				turnTime: parseInt(SecondsPerChoice.Value),
				currentTime: parseInt(SecondsPerChoice.Value),
				isRunning: false,
				isPaused: false
			}
			},
			{multi: false});
}
