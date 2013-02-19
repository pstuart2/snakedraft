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

		Drafts.update({_id: draft._id}, {$set: {sprintHours: intHours}}, {multi: false});

		Meteor.users.update({'profile.isScrumMaster': false},
				{
					$set: {
						//'profile.isAdmin': false,
						'profile.totalHoursAvailable': intHours,
						'profile.hoursLeft': intHours,
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
