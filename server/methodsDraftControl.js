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

	/**
	 * As an admin stop the draft.
	 */
	stopDraft: function() {
		if(draftTimerInterval != null) {
			Meteor.clearInterval(draftTimerInterval);
			draftTimerInterval = null;
		}

		resetDraft();
	},

	/**
	 * As an admin pause the draft.
	 */
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
 * Resets the draft to the starting point.
 */
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
					{"profile.hoursLeft": {$gt: 0}},
					{sort: {'profile.draftPosition': -draft.direction}}),
			activeUserCount,
			newCurrentUser = null;

	// If we are the only user left, ....
	activeUserCount = Meteor.users.find({"profile.hoursLeft": {$gt: 0}}).count();
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
				direction: draft.direction,
				currentUser: newCurrentUser._id,
				currentPosition: newCurrentUser.profile.draftPosition
			}
			},
			{multi: false});

	return newCurrentUser;
}
