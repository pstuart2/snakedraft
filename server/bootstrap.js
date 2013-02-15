// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	// This solves the issue
	require = __meteor_bootstrap__.require;

	var data = [
		{Name: "JiraLinkUrl", Value: "http://someurl.com", Description: "Base url for creating ticket links."},
		{Name: "JiraRestUrl", Value: "", Description: "Path for jira rest calls. (ie. 'http://jirainst.mycomp.com/rest/api/2')."},
		{Name: "JiraUser", Value: "", Description: "Username for pulling Jira tickets."},
		{Name: "JiraPass", Value: "", Description: "Password for pulling Jira tickets."},
		{Name: "EmailDomain", Value: "", Description: ""},
		{Name: "ScrumMaster", Value: "", Description: ""},
		{Name: "HoursPerDay", Value: "6", Description: ""},
		{Name: "SecondsPerChoice", Value: 60, Description: ""},
		{Name: "CycleType", Value: 1, Description: "1-Snake, 2-Sequential"} // 1 = snake, 2 = sequential
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

	/*var tickets = Tickets.find({}),
			ticketData;
	if (tickets.count() == 0) {
		ticketData = [
			{ Id: "ENC-0001", Title: "Small Title", Hours: 6, Description: "Small Description" },
			{ Id: "ENC-0002", Title: "MongoDB said:Failed", Hours: 15, Description: "Small Description" },
			{ Id: "ENC-0003", Title: "On the server", Hours: 12, Description: "Small Description" },
			{ Id: "ENC-0004", Title: "exclude certain fields from the result objects", Hours: 24, Description: "Small Description" },
			{ Id: "ENC-0005", Title: "It is not possible to mix inclusion and exclusion styles.", Hours: 12, Description: "Small Description" },
			{ Id: "ENC-0006", Title: "modifier doesn't contain any $-operators", Hours: 16, Description: "Small Description" },
			{ Id: "ENC-0007", Title: "completely replaces whatever was previously in the database.", Hours: 12, Description: "Small Description" },
			{ Id: "ENC-0008", Title: "can also contain more complicated tests", Hours: 3, Description: "Small Description" },
			{ Id: "ENC-0009", Title: "Currently Meteor uses this function to generate _id fields for new Mongo documents.", Hours: 12, Description: "Small Description" },
			{ Id: "ENC-0010", Title: "In the future we will likely switch to native binary Mongo IDs", Hours: 12, Description: "Small Description" },
			{ Id: "ENC-0011", Title: "current implementation", Hours: 18, Description: "Small Description" },
			{ Id: "ENC-0012", Title: "seeded with the current time", Hours: 22, Description: "Small Description" },
			{ Id: "ENC-0013", Title: "This returns a random text string", Hours: 32, Description: "Small Description" },
			{ Id: "ENC-0014", Title: "The format of the string complies", Hours: 48, Description: "Small Description" },
			{ Id: "ENC-0015", Title: "Returns a Universally Unique Identifier", Hours: 200, Description: "Small Description" }
		];

		for (i = 0; i < ticketData.length; i++) {
			Tickets.insert(ticketData[i]);
		}
		ENC-11546,ENC-11545,ENC-11544
	}*/
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
			userCount = Meteor.users.find({}).count();

	user.username = user.emails[0].address.split("@")[0];
	user.profile = {};
	user.profile.isSelected = false;
	user.profile.isScrumMaster = (scrumMaster.Value == user.username);
	// Admin is the first user created or the scrum master.
	user.profile.isAdmin = (userCount == 0 || user.profile.isScrumMaster);
	user.profile.totalHoursAvailable = 0;
	user.profile.hoursAssigned = 0;
	user.profile.hoursLeft = 0;
	user.profile.draftPosition = userCount + 1;

	return user;
});
