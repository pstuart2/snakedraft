Meteor.methods({
	///////////////////////////////////////////////////////////////////////////////
	// Draft Control
	///////////////////////////////////////////////////////////////////////////////
	/**
	 * As an admin skip the current users turn.
	 */
	skipTurn: function() {
		var currentUser = getUser(Meteor.userId());

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "User isn't the scrum master.");
		}

		draftChangeTurn();
	},

	/**
	 * As an admin start the draft.
	 */
	startDraft: function() {
		console.log("Starting draft");
		checkRemainingTicketsForCurrentUser();
		startDraftInterval();
	},

	/**
	 * As an admin stop the draft.
	 */
	stopInterval: function() {
		if(draftTimerInterval != null) {
			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
		}
	},

	/**
	 * As an admin pause the draft.
	 */
	startInterval: function() {
		if(draftTimerInterval == null) {
			startDraftInterval();
		}
	},

	draftChangeTurn: function() {
		draftChangeTurn();
	}
});

/**
 * Starts the draft timer interval.
 */
function startDraftInterval()
{
	// Don't do multiple starts.
	if (draftTimerInterval != null) { return; }

	draftTimerInterval = Meteor.setInterval(function() {
		var draft = Drafts.findOne({});
		if(draft.currentTime <= 0) {
			draftChangeTurn();
		} else {
			Drafts.update({_id: draft._id}, {$inc: {currentTime: -1}, $set: {isRunning: true}}, {multi: false});
		}
	}, 1000);
}

/**
 * Finishes a draft.
 *
 * @param draft
 */
function finishDraft(draft)
{
	Drafts.update({_id: draft._id},
			{$set:
			{
				currentTime: draft.turnTime,
				isPaused: false,
				isRunning: false,
				direction: draft.direction,
				currentUser: 0,
				forcedTicketSize: 0,
				currentPosition: 1
			}
			},
			{multi: false});
}

/**
 * Changes the turn for the draft.
 */
function draftChangeTurn()
{
	// Stop our interval.
	if(draftTimerInterval != null) {
		Meteor.clearInterval(draftTimerInterval);
		draftTimerInterval = null;
	}

	if(updateNewCurrentUser()) {
		startDraftInterval();
	}
}

/**
 * Changes the current user for a draft.
 *
 * @return {*}
 */
function updateNewCurrentUser()
{
	var draft = Drafts.findOne({}),
			lastUser = Meteor.users.findOne(
					{'profile.isScrumMaster': false, "profile.hoursLeft": {$gt: 0}},
					{sort: {'profile.draftPosition': -draft.direction}}),
			activeUserCount,
			newCurrentUser = null;

	// If we are the only user left, ....
	activeUserCount = Meteor.users.find({'profile.isScrumMaster': false, "profile.hoursLeft": {$gt: 0}}).count();
	if (activeUserCount == 1) { newCurrentUser = lastUser; }
	if (activeUserCount == 0 || Tickets.find({AssignedUserId: {$exists: false}}).count() == 0) {
		// Draft is over!
		finishDraft(draft);
		return false;
	}

	if (newCurrentUser == null) {
		if (draft.cycleType == 2)
		{
			// Sequential cycle
			if (draft.currentPosition >= lastUser.profile.draftPosition) {
				// Go back to the beginning.
				newCurrentUser = Meteor.users.findOne(
						{"profile.hoursLeft": {$gt: 0}},
						{sort: {'profile.draftPosition': draft.direction}});
			}
		} else {
			// Snake cycle...
			console.log("===== Snake cycle....Dir: " + draft.direction);
			console.log("LastUser: (" + lastUser.profile.draftPosition + ") " + lastUser.username);

			if ((draft.direction > 0 && draft.currentPosition >= lastUser.profile.draftPosition) ||
					(draft.direction < 0 && draft.currentPosition <= lastUser.profile.draftPosition)) {
				console.log("Switching direction...");
				newCurrentUser = lastUser;
				draft.direction = -draft.direction;
			}
		}

		// Get the next one in line.
		if (newCurrentUser == null) {
			console.log("newCurrentUser == null...");
			if (draft.direction > 0) {
				newCurrentUser = Meteor.users.findOne(
						{"profile.hoursLeft": {$gt: 0}, 'profile.draftPosition': {$gt: draft.currentPosition}},
						{sort: {'profile.draftPosition': draft.direction}});
			} else {
				newCurrentUser = Meteor.users.findOne(
						{"profile.hoursLeft": {$gt: 0}, 'profile.draftPosition': {$lt: draft.currentPosition}},
						{sort: {'profile.draftPosition': draft.direction}});
			}
		}

		if (!newCurrentUser) {
			finishDraft(draft);
			return false;
		}
	}

	Drafts.update({_id: draft._id},
			{$set:
			{
				currentTime: draft.turnTime,
				isPaused: false,
				isRunning: true,
				forcedTicketSize: 0,
				direction: draft.direction,
				currentUser: newCurrentUser._id,
				currentPosition: newCurrentUser.profile.draftPosition
			}
			},
			{multi: false});

	return checkRemainingTicketsForCurrentUser();
}

function checkRemainingTicketsForCurrentUser()
{
	var AllowAutoAssign = Configs.findOne({Name: "AllowAutoAssign"}),
			AutoAssignChangesTurn = Configs.findOne({Name: "AutoAssignChangesTurn"}),
			draft = Drafts.findOne({}),
			user = Meteor.users.findOne({_id: draft.currentUser}),
			tickets = Tickets.find({AssignedUserId: {$exists: false}, Hours: {$lte: user.profile.hoursLeft}}, {sort: {Hours: -1}}),
			maxHours = 0, maxHourCount = 0, usersWhoCan, firstTicket;

	// We do not allow auto-assing.
	if (AllowAutoAssign.Value == 0) { return user; }

	// Get the biggest ticket I can handle and how many of them there are.
	tickets.forEach(function(ticket) {
		if (maxHours == 0) {
			firstTicket = ticket;
			maxHours = ticket.Hours;
		}
		if (maxHours == ticket.Hours) {
			maxHourCount++;
		}
	});

	// Now get the list of users who can take a ticket this size.
	usersWhoCan = Meteor.users.find({'profile.hoursLeft': {$gte: maxHours}}).count();

	console.log("---------------------------------");
	console.log("MaxHours: " + maxHours + " Number Users: " + usersWhoCan + " MaxHourCount: " + maxHourCount);

	if (usersWhoCan > maxHourCount /*&& usersWhoCan >= maxHourCount*/) {
		// There are plenty of users left to take a ticket of this size.
		console.log("Plenty of users.");
		return user;
	}

	if (AllowAutoAssign.Value == 2 && usersWhoCan == 1) {
		// I'm the only one who can take it.
		console.log("I'm the only one who can take it.");
		assignTicketToUser(user._id, firstTicket._id, firstTicket.Hours);

		var msg = '<b>' + user.username + '</b> was forced to take ticket <b>' + firstTicket.Id + '</b>.';
		createUserMessage(user._id, msg, "alert alert-info");
		createUserMessage(draft.scrumMasterId, msg, "alert alert-info");

		if (AutoAssignChangesTurn.Value > 0 || user.profile.hoursLeft <= firstTicket.Hours) {
			console.log("Must change turn.");
			return updateNewCurrentUser();
		}
	} else {
		// I have to take one of the tickets of this size.
		console.log("I have to take a ticket of this size.")
		Drafts.update({},
				{$set:
				{
					forcedTicketSize: maxHours
				}
				},
				{multi: false});
	}

	return user;
}
