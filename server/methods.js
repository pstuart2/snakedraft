var draftTimerInterval = null;

Meteor.methods({
	takeTicket: function (userId, ticketId) {
		var ticket, assignee, currentUser, hours, draft;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		hours = ticket.Hours;
		assignee = getUser(userId);
		currentUser = getUser(Meteor.userId());
		draft = Drafts.findOne({});

		if (!currentUser.profile.isAdmin) {

			if (!draft.currentUser == userId) {
				throw new Meteor.Error(302, "Not your turn.");
			}

			if (assignee.profile.totalHoursAvailable < ticket.Hours) {
				throw new Meteor.Error(302, "User doesn't have enough hours.");
			}
		}

		Tickets.update({_id: ticketId},
				{$set: {AssignedUserId: userId}},
				{multi: false});

		console.log("Hours: " + hours);
		Meteor.users.update({_id: userId},
				{$inc: {'profile.hoursLeft': -hours, 'profile.hoursAssigned': hours}},
				{multi: false});

		draftChangeTurn();

		return true;
	},

	skipTurn: function() {
		var currentUser = getUser(Meteor.userId());

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "User isn't the scrum master.");
		}

		draftChangeTurn();
	},

	resetDatabase: function(sprintHours) {
		var currentUser = getUser(Meteor.userId());

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
		var currentUser = getUser(Meteor.userId());

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
		} else if (config.Name == "CycleType") {
			Drafts.update({},
					{$set: {
						cycleType: parseInt(value)
					}
					},
					{multi: false});
		}
	},

	editUser: function(userId, fields) {
		var currentUser = getUser(Meteor.userId()),
				oldUserRec,
				newDraftPos;

		// Ensure we are allowed to edit.
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "You cannot edit this user.");
		}

		// Get our old user record.
		oldUserRec = getUser(userId);
		newDraftPos = fields['profile.draftPosition'];

		// We don't want to update our draft position now, do it later.
		fields['profile.draftPosition'] = oldUserRec.profile.draftPosition;

		// Update our user.
		Meteor.users.update({_id: userId},
				{
					$set: fields
				},
				{multi: false});



		// Check to see if our draft position changed...
		if (oldUserRec.profile.draftPosition != newDraftPos) {
			movePeep(userId, newDraftPos);
		}
	},

	randomizeDraftees: function() {
		var currentUser = getUser(Meteor.userId());

		var draft = Drafts.findOne({});
		if (!(currentUser.profile.isAdmin || draft.isRunning)) {
			throw new Meteor.Error(404, "You cannot do that!");
		}

		var peeps = getUsers({}),
				peepCount = peeps.count(),
				newPeepPos = new Array(),
				arrPos = 0;

		peeps.forEach(function(peep)
		{
			newPeepPos[arrPos++] = {id: peep._id, newPos: Math.floor((Math.random()*peepCount)+1)};
		});

		_.each(newPeepPos, function(newPos) {
			movePeep(newPos.id, newPos.newPos);
		});
	},

	startDraft: function() {
		var currentUser = getUser(Meteor.userId()),
				firstPlayer;

		if (!(currentUser.profile.isAdmin || draftTimerInterval != null)) {
			throw new Meteor.Error(404, "You cannot start the draft.");
		}

		var draft = Drafts.findOne({});
		if (draft.isRunning) {
			throw new Meteor.Error(404, "Draft is already running.");
		}

		resetDraft();

		// Get our first player.
		firstPlayer = Meteor.users.findOne(
				{"profile.hoursLeft": {$gt: 0}},
				{sort: {"profile.draftPosition": 1}});

		console.log("firstPlayer: " + firstPlayer.profile.draftPosition);

		// Set our starting user in the draft.
		Drafts.update({_id: draft._id}, {$set: {currentUser: firstPlayer._id, isRunning: true, currentPosition: firstPlayer.profile.draftPosition, direction: 1}},
				{multi: false});

		startDraftInterval();
	},
	stopDraft: function() {
		if(draftTimerInterval != null) {
			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
		}

		resetDraft();
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
	},

	toggleRecTicket: function(userId, recUsername, ticketId, isRec) {
		var ticket = Tickets.findOne({_id: ticketId}),
				user = Meteor.users.findOne({_id: userId}),
				foundRec = false;

		console.log("toggleRecTicket...");
		if (!ticket.recommends) {
			ticket.recommends = [];
		}

		console.log("_.each...");
		_.each(ticket.recommends, function(rec) {
			if (rec.by == user.username) {
				foundRec = true;
				if (isRec && rec.users.indexOf(recUsername) < 0) {
					rec.users += "," + recUsername;
				} else if (!isRec && rec.users.indexOf(recUsername) >= 0) {
					rec.users = rec.users.replace(recUsername, "").replace(",,", ",");
				}
			}
		});

		console.log("!found..." + isRec);
		if (!foundRec && isRec) {
			console.log("Adding Length: " + ticket.recommends.length);
			ticket.recommends[ticket.recommends.length] = {by: user.username, users: recUsername};
		}

		Tickets.update({_id: ticket._id},
				{$set: {recommends: ticket.recommends}},
				{multi: false});
	}
});

function getUser(userId)
{
	return Meteor.users.findOne({_id: userId}, {fields: {username: 1, profile: 1}});
}

function getUsers(filter)
{
	return Meteor.users.find(filter, {fields: {username: 1, profile: 1}})
}

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

function resetDraft()
{
	var SecondsPerChoice = Configs.findOne({Name: 'SecondsPerChoice'});

	Drafts.update({},
			{$set: {
				turnTime: parseInt(SecondsPerChoice.Value),
				currentTime: parseInt(SecondsPerChoice.Value),
				isRunning: false,
				isPaused: false,
				currentPosition: 1
			}
			},
			{multi: false});
}

function movePeep(userId, newDraftPos)
{
	var pos,
			endPos,
			increment,
			userCount,
			oldUserRec = getUser(userId);

	// Get our user count so we do not exceed our draft position.
	userCount = Meteor.users.find({}).count();
	if (userCount < newDraftPos) {
		// Draft position exceeded, change to last place.
		newDraftPos = userCount;
	}

	// Update our user.
	Meteor.users.update({_id: userId},
			{
				$set: {'profile.draftPosition': newDraftPos}
			},
			{multi: false});

	// Determine if we are moving up or moving down.
	if (oldUserRec.profile.draftPosition > newDraftPos) {
		pos = newDraftPos;
		endPos = oldUserRec.profile.draftPosition;
		increment = 1;
	} else {
		pos = oldUserRec.profile.draftPosition;
		endPos = newDraftPos;
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

function updateNewCurrentUser()
{
	var draft = Drafts.findOne({}),
			lastUser = Meteor.users.findOne(
					{"profile.hoursLeft": {$gt: 0}},
					{sort: {'profile.draftPosition': -draft.direction}}),
			activeUserCount,
			newCurrentUser = null;

	// If we are the only user left, ....
	activeUserCount = Meteor.users.find({"profile.hoursLeft": {$gt: 0}}).count();
	if (activeUserCount == 1) { return lastUser; }
	if (activeUserCount == 0) {
		// Draft is over!
		resetDraft();
		return false;
	}

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

	console.log("NEWUser: (" + newCurrentUser.profile.draftPosition + ") " + newCurrentUser.username);

	Drafts.update({_id: draft._id},
			{$set:
				{
					currentTime: draft.turnTime,
					isPaused: false,
					isRunning: true,
					direction: draft.direction,
					currentUser: newCurrentUser._id,
					currentPosition: newCurrentUser.profile.draftPosition
				}
			},
			{multi: false});

	return newCurrentUser;
}
