// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	// This solves the issue
	require = __meteor_bootstrap__.require;

	var data = [
		{IsVisible: false, Encrypt: true, Name: "JiraCredentials", Value: "", Description: ""},
		{IsVisible: false, Encrypt: false, Name: "JiraLinkUrl", Value: "http://someurl.com", Description: "Base url for creating ticket links."},
		{IsVisible: false, Encrypt: false, Name: "JiraRestUrl", Value: "", Description: "Path for jira rest calls."},

		{IsVisible: true, Encrypt: false, Name: "EmailDomain", Value: "", Description: ""},
		{IsVisible: true, Encrypt: false, Name: "ScrumMaster", Value: "", Description: ""},
		{IsVisible: true, Encrypt: false, Name: "HoursPerDay", Value: "6", Description: ""},
		{IsVisible: true, Encrypt: false, Name: "SecondsPerChoice", Value: 60, Description: ""},
		{IsVisible: true, Encrypt: false, Name: "CycleType", Value: 1, Description: "1-Snake, 2-Sequential"}, // 1 = snake, 2 = sequential
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
	user.profile.isScrumMaster = (scrumMaster.Value == user.username);
	// Admin is the first user created or the scrum master.
	user.profile.isAdmin = (userCount == 0 || user.profile.isScrumMaster);
	if (user.profile.isScrumMaster) {
		user.profile.totalHoursAvailable = 0;
		user.profile.hoursLeft = 0;
	} else {
		user.profile.totalHoursAvailable = draft.sprintHours;
		user.profile.hoursLeft = draft.sprintHours;
	}

	user.profile.hoursAssigned = 0;

	user.profile.draftPosition = userCount + 1;

	return user;
});
