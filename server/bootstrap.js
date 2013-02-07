// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	var data = [
		{Name: "JiraUrl", Value: "http://someurl.com"},
		{Name: "EmailDomain", Value: ""},
		{Name: "ScrumMaster", Value: ""},
		{Name: "HoursPerDay", Value: "6"},
		{Name: "SecondsPerChoice", Value: 60}
	];

	if (Configs.find().count() != data.length) {
		for (var i = 0; i < data.length; i++) {
			if (Configs.findOne({Name: data[i].Name}) == null) {
				Configs.insert(data[i]);
			}
		}
	}

	var draft = Drafts.findOne({}),
			config = Configs.findOne({Name: "SecondsPerChoice"}),
			defaults = {
				turnTime: parseInt(config.Value),
				currentTime: parseInt(config.Value),
				isPaused: false,
				isRunning: false
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
