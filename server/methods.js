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

		if (!(currentUser.profile.isAdmin || currentUser._id == userId)) {
			throw new Meteor.Error(404, "You cannot edit this user.");
		}

		oldUserRec = Meteor.users.findOne({_id: userId});

		userCount = Meteor.users.find({}).count();
		if (userCount < fields['profile.draftPosition']) {
			fields['profile.draftPosition'] = userCount;
		}

		console.log("UserCount: " + userCount
				+ " oldPos: " + oldUserRec.profile.draftPosition
				+ " newPos: " + fields['profile.draftPosition']
		);

		Meteor.users.update({_id: userId},
				{
					$set: fields
				},
				{multi: false});

		if (oldUserRec.profile.draftPosition != fields['profile.draftPosition']) {
			Meteor.users.update({
						'profile.draftPosition': {$gte: fields['profile.draftPosition']},
						_id: {$ne: userId}
					},
					{$inc: {'profile.draftPosition': 1}},
					{multi: true});

		}
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

		var SecondsPerChoice = Configs.findOne({Name: 'SecondsPerChoice'});

		Drafts.update({},
				{$set: {
						turnTime: SecondsPerChoice.Value,
						currentTime: SecondsPerChoice.Value,
						isRunning: true,
						isPaused: false
					}
				},
				{multi: false});

		draftTimerInterval = Meteor.setInterval(function() {
			var draft = Drafts.findOne({});
			if(draft.currentTime <= 0) {
				Drafts.update({_id: draft._id}, {$set: {currentTime: draft.turnTime}}, {multi: false});
			} else {
				Drafts.update({_id: draft._id}, {$inc: {currentTime: -1}}, {multi: false});
			}
		}, 1000);
	},
	stopDraft: function() {
		if(draftTimerInterval != null) {
			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
		}
	},

	pauseDraft: function() {
		if(draftTimerInterval != null) {
			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
		}

		Drafts.update({},
				{$set: {isPaused: true}},
				{multi: false});
	}
});
