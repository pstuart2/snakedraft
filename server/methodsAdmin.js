Meteor.methods({
	///////////////////////////////////////////////////////////////////////////////
	// Admin Menu Actions
	///////////////////////////////////////////////////////////////////////////////
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
			Configs.update(id, {$set: {Value: sd.encryptValue(value)}});
		} else {
			Configs.update(id, {$set: {Value: value}});
		}

		var config = Configs.findOne({_id: id});
		if (config.Name == "SecondsPerChoice") {
			Drafts.update({id: 1},
					{$set: {
						turnTime: value,
						currentTime: value
					}
					},
					{multi: false});
		} else if (config.Name == "CycleType") {
			Drafts.update({id: 1},
					{$set: {
						cycleType: parseInt(value)
					}
					},
					{multi: false});
		} else if (config.Name == "ScrumMaster") {
			Meteor.users.update({}, {$set: {'profile.isScrumMaster': false}}, {multi: true});
			var newScrumMaster = Meteor.users.findOne({username: value});
			if (newScrumMaster) {
				Meteor.users.update({_id: newScrumMaster._id}, {$set: {'profile.isScrumMaster': true, 'profile.hoursLeft': 0}}, {multi: false});
				Drafts.update({id: 1}, {$set: {scrumMasterId: newScrumMaster._id}}, {multi: false});
			} else {
				Drafts.update({id: 1}, {$set: {scrumMasterId: 0}}, {multi: false});
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
				jiraValue = username + ":" + password,
				encryptedValue = sd.encryptValue(jiraValue);

		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(404, "User isn't the scrum master.");
		}

		Configs.update({Name: "JiraCredentials"}, {$set: {Value: encryptedValue}}, {multi: false});
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
			result = sd.getJiraObject('/filter/' + filterId);
			console.log("Got Jira Object: " + result.searchUrl)

			// Now get the search url.
			result = sd.callJira("GET", decodeURI(result.searchUrl));
			console.log("Call to Jira Complete.: " + filterId)

			// Loop over my issues and add them.
			_.each(result.issues, function(issue) {
				sd.addJiraTicket(issue);
			});
		}

		ticketArr = tickets.split(",");
		_.each(ticketArr, function(ticket) {
			result = sd.getJiraObject('/issue/' + ticket);
			sd.addJiraTicket(result);
		});

		checkHoursVsTicketHours(Meteor.userId());
	},

	/**
	 * Resets the database.
	 *
	 * @param sprintHours
	 */
	resetDb: function(sprintHours) {
		// Remove all tickets.
		Tickets.remove({});
		// Remove all messages.
		Messages.remove({});
		UserMessages.remove({});

		Drafts.update({id: 1}, {$set: {sprintHours: sprintHours}}, {multi: false});

		Meteor.users.update({'profile.isScrumMaster': false},
				{
					$set: {
						'profile.hoursAvailable': sprintHours,
						'profile.hoursLeft': sprintHours,
						'profile.hoursAssigned': 0
					}
				}, {multi: true});

		checkHoursVsTicketHours(Meteor.userId());
	}
});

calculateUserHoursTicketHours = function()
{
	var unassignedTickets = Tickets.find({}),
			users = Meteor.users.find({'profile.isScrumMaster': false}),
			totalTicketHours = 0, totalUserHours = 0,
			totalRemainingTicketHours = 0, totalUserHoursLeft = 0;

	users.forEach(function(user) {
		totalUserHoursLeft += user.profile.hoursLeft;
		totalUserHours += user.profile.hoursAvailable;
	});

	unassignedTickets.forEach(function(ticket) {
		totalTicketHours += ticket.Hours;
		if (!ticket.hasOwnProperty('AssignedUserId')) {
			totalRemainingTicketHours += ticket.Hours;
		}
	});

	Drafts.update({id: 1}, {$set: {
		totalUserHours: totalUserHours,
		totalTicketHours: totalTicketHours,
		remainingUserHours: totalUserHoursLeft,
		remainingTicketHours: totalRemainingTicketHours
	}}, {multi: false});

	if (totalRemainingTicketHours > totalUserHoursLeft) {
		return "Total unassigned ticket hours (<b>" + totalRemainingTicketHours + "</b>) exceeds user remaining hours (<b>" + totalUserHoursLeft + "</b>)"
	}

	return false;
}

checkHoursVsTicketHours = function(currentUserId)
{
	var msg = calculateUserHoursTicketHours();
	if (msg) {
		// We have a problem.
		//createUserMessage(currentUserId, msg, "alert");
	}
}
