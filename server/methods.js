var draftTimerInterval = null,
		cipherKey = 'n33ds0mehintbet1',
		cipherIv = '5622587455896325',
		cipherType = 'aes-128-cbc';

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
	},

	///////////////////////////////////////////////////////////////////////////////
	// Ticket Functions
	///////////////////////////////////////////////////////////////////////////////
	/**
	 * As a user toggle ticket recommendation.
	 *
	 * @param userId
	 * @param recUsername
	 * @param ticketId
	 * @param isRec
	 */
	toggleRecTicket: function(userId, recUsername, ticketId, isRec) {
		var ticket = Tickets.findOne({_id: ticketId}),
				byUser = Meteor.users.findOne({_id: userId}),
				foundUser;

		if (!ticket.recommends) {
			ticket.recommends = [];
		}

		foundUser = _.find(ticket.recommends, function(rec) { return rec.user == recUsername; });
		if (foundUser) {
			foundUser.by = _.reject(foundUser.by, function(user) { return user.username == byUser.username; });
			if (isRec) {
				foundUser.by[foundUser.by.length] = {username: byUser.username};
			} else {
				if (foundUser.by.length == 0) {
					ticket.recommends = _.reject(ticket.recommends, function(rec) { return rec.user == recUsername; });
				}
			}
		} else {
			ticket.recommends[ticket.recommends.length] =
			{user: recUsername, by: [{username: byUser.username}]};
		}

		Tickets.update({_id: ticket._id},
				{$set: {recommends: ticket.recommends}},
				{multi: false});
	},

	editTicket: function(ticketId, values) {

	},

	/**
	 * Take a ticket when it is your turn.
	 *
	 * @param userId
	 * @param ticketId
	 * @return {Boolean}
	 */
	takeTicket: function (userId, ticketId) {
		var ticket, assignee, draft;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		assignee = getUser(userId);
		draft = Drafts.findOne({});

		if (!draft.currentUser == userId) {
			throw new Meteor.Error(302, "Not your turn.");
		}

		if (assignee.profile.totalHoursAvailable < ticket.Hours) {
			throw new Meteor.Error(302, "User doesn't have enough hours.");
		}


		assignTicketToUser(userId, ticketId, ticket.Hours);
		draftChangeTurn();

		return true;
	},

	/**
	 * As an admin assign a ticket to a user.
	 *
	 * @param userId
	 * @param ticketId
	 */
	assignTicket: function(userId, ticketId) {
		var ticket, currentUser;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		currentUser = getUser(Meteor.userId());
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "You cannot assign tickets.");
		}

		assignTicketToUser(userId, ticketId, ticket.Hours);
	},

	/**
	 * As an admin un-assign tickets from a user.
	 *
	 * @param ticketId
	 */
	unassignTicket: function(ticketId) {
		var ticket, currentUser;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		currentUser = getUser(Meteor.userId());
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "You cannot assign tickets.");
		}

		Tickets.update({_id: ticketId},
				{$unset: {AssignedUserId: 1}},
				{multi: false});

		Meteor.users.update({_id: ticket.AssignedUserId},
				{$inc: {'profile.hoursLeft': ticket.Hours, 'profile.hoursAssigned': -ticket.Hours}},
				{multi: false});
	},

	/**
	 * Deletes a ticket from the system.
	 *
	 * @param ticketId
	 */
	deleteTicket: function(ticketId) {
		var ticket, currentUser;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		currentUser = getUser(Meteor.userId());
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "You cannot delete tickets.");
		}

		Tickets.remove({_id: ticketId});
	},

	///////////////////////////////////////////////////////////////////////////////
	// Admin Menu Actions
	///////////////////////////////////////////////////////////////////////////////
	/**
	 * As an admin reset the database for a new draft.
	 *
	 * @param sprintHours
	 */
	resetDatabase: function(sprintHours) {
		var currentUser = getUser(Meteor.userId());

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		console.log("Resetting db");
		console.log("SprintHours: " + sprintHours);

		// Remove all tickets.
		Tickets.remove({});
		// Remove all messages.
		Messages.remove({});

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

	/**
	 * As an admin update a config value.
	 *
	 * @param id
	 * @param value
	 */
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

	/**
	 * Encryptes the jira credentials.
	 *
	 * @param username
	 * @param password
	 */
	updateJiraCredentials: function(username, password) {
		var currentUser = getUser(Meteor.userId()),
				encryptedValue = encryptValue(username + ":" + password);

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		Configs.update({Name: "JiraCredentials"}, {$set: {Value: encryptedValue}}, {multi: false});
	},

	/**
	 * As an admin edit a user.
	 *
	 * @param userId
	 * @param fields
	 */
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

	/**
	 * As an admin randomize the draft order.
	 */
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

	/**
	 * Add tickets from Jira.
	 *
	 * @param tickets
	 * @param filterIdInp
	 */
	addJiraTickets: function(tickets, filterIdInp) {
		var currentUser = getUser(Meteor.userId()),
				filterId = parseInt(filterIdInp),
				ticketArr, hours, result;

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "You cannot do that!");
		}

		console.log("FilterId: " + filterId);
		if (filterId > 0) {
			result = getJiraObject('/filter/' + filterId);
			// Now get the search url.
			result = callJira("GET", decodeURI(result.searchUrl));
			// Loop over my issues and add them.
			_.each(result.issues, function(issue) {
				addJiraTicket(issue);
			});
		}

		ticketArr = tickets.split(",");
		_.each(ticketArr, function(ticket) {
			result = getJiraObject('/issue/' + ticket);
			addJiraTicket(result);
		});
	}
});


///////////////////////////////////////////////////////////////////////////////
// Helper Methods
///////////////////////////////////////////////////////////////////////////////
function getUser(userId)
{
	return Meteor.users.findOne({_id: userId}, {fields: {username: 1, profile: 1}});
}

function getUsers(filter)
{
	return Meteor.users.find(filter, {fields: {username: 1, profile: 1}})
}

function getJiraObject(query)
{
	var JiraRestUrl = Configs.findOne({Name: "JiraRestUrl"}).Value;
	return callJira("GET", JiraRestUrl + query);
}

function callJira(type, url) {
	var jiraUser = decryptValue(Configs.findOne({Name: "JiraCredentials"}).Value);

	var result = Meteor.http.call(type, url, {
		timeout: 30000,
		auth: jiraUser,
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (result.content.substr(0, 1) == "<") {
		console.log(result.content);
		return false;
	}


	return JSON.parse(result.content);
}

function addJiraTicket(ticket)
{
	if (ticket) {
		var hours = 0;
		if (ticket.fields.timetracking != null) {
			hours = secondsToHours(ticket.fields.timetracking.originalEstimateSeconds);
		} else if (ticket.fields.progress != null) {
			hours = secondsToHours(ticket.fields.progress.total);
		}

		addTicket(ticket.key, ticket.fields.summary, ticket.fields.description, hours);
	}
}

function encryptValue(value)
{
	var crypto = require('crypto'),
			cipher = crypto.createCipheriv(cipherType, cipherKey, cipherIv),
			crypted = cipher.update(value, 'utf-8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

function decryptValue(value)
{
	var crypto = require('crypto'),
			decipher = crypto.createDecipheriv(cipherType, cipherKey, cipherIv),
			decrypted = decipher.update(value, 'hex', 'utf-8');
	decrypted += decipher.final('utf-8');
	return decrypted;
}

function secondsToHours(seconds) {
	return (seconds / 60 / 60);
}

function addTicket(Id, Title, Description, Hours) {
	var ticket = Tickets.findOne({Id: Id});
	if (!ticket) {
		Tickets.insert({Id: Id, Title: Title, Description: Description, Hours: parseInt(Hours)});
	}
}

function assignTicketToUser(userId, ticketId, hours) {
	Tickets.update({_id: ticketId},
			{$set: {AssignedUserId: userId}},
			{multi: false});

	Meteor.users.update({_id: userId},
			{$inc: {'profile.hoursLeft': -hours, 'profile.hoursAssigned': hours}},
			{multi: false});
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
