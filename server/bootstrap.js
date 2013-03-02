// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	// This solves the issue
	require = __meteor_bootstrap__.require;

	var data = [
		{IsVisible: false, Encrypt: true, Name: "JiraCredentials", Value: "", Description: ""},
		{IsVisible: false, Encrypt: false, Name: "JiraLinkUrl", Value: "http://someurl.com", Description: "Base url for creating ticket links."},
		{IsVisible: false, Encrypt: false, Name: "JiraRestUrl", Value: "", Description: "Path for jira rest calls."},

		{IsVisible: true, Encrypt: false, Name: "EmailDomain", Value: "", Description: "Restricts registrations to this email domain."},
		{IsVisible: true, Encrypt: false, Name: "ScrumMaster", Value: "", Description: "When resetting a sprint, the 'scrum master' will still remain at 0 available hours."},
		{IsVisible: true, Encrypt: false, Name: "HoursPerDay", Value: "6", Description: "Total number of hours to calculate into a day."},
		{IsVisible: true, Encrypt: false, Name: "SecondsPerChoice", Value: 60, Description: "How many seconds a user gets to choose a ticket."},
		{IsVisible: true, Encrypt: false, Name: "CycleType", Value: 1, Description: "1-Snake, 2-Sequential"},
		{IsVisible: true, Encrypt: false, Name: "AllowAutoAssign", Value: 1, Description: "0-Let it play out. 1-Will filter the tickets on screen but will not be automatic. 2-Will force a user to take a ticket if there are no other users with enough time."},
		{IsVisible: true, Encrypt: false, Name: "AutoAssignChangesTurn", Value: 1, Description: "1-When a ticket is auto-assigned that counts as a turn. 0-Will allow them to make a choice if they have available time."},

		{IsVisible: true, Encrypt: true, Name: "ViewerControlPassword", Value: "pass123", Description: "Password for enabling the viewer to assign tickets."}
	];


	for (var i = 0; i < data.length; i++) {
		var setting = Configs.findOne({Name: data[i].Name});
		if (!setting) {
			Configs.insert(data[i]);
		} else {
			data[i]["Value"] = setting.Value;
			Configs.update({_id: setting._id}, {$set: data[i]}, {multi: false});
		}
	}

	var draft = Drafts.findOne({}),
			config = Configs.findOne({Name: "SecondsPerChoice"}),
			draftType = Configs.findOne({Name: "CycleType"}),
			defaults = {
				turnTime: parseInt(config.Value),
				currentTime: parseInt(config.Value),
				isPaused: false,
				isRunning: false,
				forcedTicketSize: 0,
				totalUserHours: 0,
				totalTicketHours: 0,
				remainingUserHours: 0,
				remainingTicketHours: 0,
				cycleType: parseInt(draftType.Value)
			};
	if(!draft) {
		console.log("BOOTSTRAP: Creating default draft.");
		defaults.sprintHours = 90;
		Drafts.insert(defaults);
	} else {
		// If for some reason we reload make sure the interval is running again.
		console.log("BOOTSTRAP: draft.isRunning: " + draft.isRunning);
		if (draft.isRunning) {
			if (!draft.isPaused) {
				startDraftInterval();
			}
		} else {
			console.log("BOOTSTRAP: Updating default draft.");
			Drafts.update({_id: draft._id},
					{$set: defaults},
					{multi: false});
		}
	}

	/*
	ENC-11546,ENC-11545,ENC-11544
	*/
});

// Only valid email domain users.
Accounts.validateNewUser(function(user) {
	var emailDomain = Configs.findOne({Name: "EmailDomain"});
	if (!endsWith(user.emails[0].address, emailDomain.Value)) {
		throw new Meteor.Error(403, "Invalid email domain!");
	}

	return true;
});

Accounts.onCreateUser(function(options, user) {
	var scrumMaster = Configs.findOne({Name: "ScrumMaster"}),
			userCount = Meteor.users.find({}).count(),
			draft = Drafts.findOne({});

	user.username = user.emails[0].address.split("@")[0];
	user.profile = {};
	user.profile.isSelected = false;
	if (scrumMaster.Value == user.username) {
		user.profile.isScrumMaster = true;
		user.profile.isAdmin = true;
		user.profile.totalHoursAvailable = 0;
		user.profile.hoursLeft = 0;
	} else {
		user.profile.isAdmin = (userCount == 0);
		user.profile.totalHoursAvailable = draft.sprintHours;
		user.profile.hoursLeft = draft.sprintHours;
		user.profile.draftPosition = userCount + 1;
	}

	user.profile.hoursAssigned = 0;

	return user;
});
