Meteor.methods({
	///////////////////////////////////////////////////////////////////////////////
	// Admin Menu Actions
	///////////////////////////////////////////////////////////////////////////////
	/**
	 * As an admin reset the database for a new draft.
	 *
	 * @param sprintHours
	 */
	resetDatabase: function(sprintHours) {
		var currentUser = getUser(Meteor.userId()),
				draft = Drafts.findOne({})
				intHours = parseInt(sprintHours);

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		console.log("Resetting db");
		console.log("SprintHours: " + sprintHours);

		// Remove all tickets.
		Tickets.remove({});
		// Remove all messages.
		Messages.remove({});
		UserMessages.remove({});

		Drafts.update({_id: draft._id}, {$set: {sprintHours: intHours}}, {multi: false});

		Meteor.users.update({'profile.isScrumMaster': {$exists: false}},
				{
					$set: {
						'profile.totalHoursAvailable': intHours,
						'profile.hoursLeft': intHours,
						'profile.hoursAssigned': 0
					}
				}, {multi: true});

		checkHoursVsTicketHours(Meteor.userId());
	},

	/**
	 * As an admin update a config value.
	 *
	 * @param id
	 * @param value
	 */
	updateConfig: function(id, value) {
		var currentUser = getUser(Meteor.userId()),
				config = Configs.findOne({_id: id});

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		if (config.Encrypt) {
			Configs.update(id, {$set: {Value: encryptValue(value)}});
		} else {
			Configs.update(id, {$set: {Value: value}});
		}

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
		} else if (config.Name == "ScrumMaster") {
			Meteor.users.update({}, {$unset: {'profile.isScrumMaster': 1}}, {multi: true});
			var newScrumMaster = Meteor.users.findOne({username: value});
			if (newScrumMaster) {
				Meteor.users.update({_id: newScrumMaster._id}, {$set: {'profile.isScrumMaster': true, 'profile.hoursLeft': 0}}, {multi: false});
				Drafts.update({}, {$set: {scrumMasterId: newScrumMaster._id}}, {multi: false});
			} else {
				Drafts.update({}, {$set: {scrumMasterId: 0}}, {multi: false});
			}

			checkHoursVsTicketHours(Meteor.userId());
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

		checkHoursVsTicketHours(Meteor.userId());
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

		var peeps = getUsers({'profile.isScrumMaster': {$exists: false}}),
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
				ticketArr, result;

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

		checkHoursVsTicketHours(Meteor.userId());
	},

	/**
	 * Checks the password for enabling viewer control.
	 *
	 * @param password
	 * @return {Boolean}
	 */
	checkViewerControlPassword: function(password) {
		var configPass = decryptValue(Configs.findOne({Name: "ViewerControlPassword"}).Value);
		return configPass == password;
	}
});

function checkHoursVsTicketHours(currentUserId)
{
	var unassignedTickets = Tickets.find({}),
			users = Meteor.users.find({'profile.isScrumMaster': {$exists: false}}),
			totalTicketHours = 0, totalUserHours = 0,
			totalRemainingTicketHours = 0, totalUserHoursLeft = 0;

	users.forEach(function(user) {
		totalUserHoursLeft += user.profile.hoursLeft;
		totalUserHours += user.profile.totalHoursAvailable;
	});

	unassignedTickets.forEach(function(ticket) {
		totalTicketHours += ticket.Hours;
		if (!ticket.hasOwnProperty('AssignedUserId')) {
			totalRemainingTicketHours += ticket.Hours;
		}
	});

	Drafts.update({}, {$set: {
		totalUserHours: totalUserHours,
		totalTicketHours: totalTicketHours,
		remainingUserHours: totalUserHoursLeft,
		remainingTicketHours: totalRemainingTicketHours
	}}, {multi: false});

	if (totalRemainingTicketHours > totalUserHoursLeft) {
		// We have a problem.
		createUserMessage(currentUserId, "Total unassigned ticket hours (<b>" + totalRemainingTicketHours + "</b>) exceeds user remaining hours (<b>" + totalUserHoursLeft + "</b>)", "alert");
	}
}
