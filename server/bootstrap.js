// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	var data = [
		{Name: "JiraUrl", Value: "http://someurl.com"},
		{Name: "EmailDomain", Value: ""},
		{Name: "ScrumMaster", Value: ""},
		{Name: "SecondsPerChoice", Value: 60}
	];

	if (Configs.find().count() != data.length) {
		for (var i = 0; i < data.length; i++) {
			if (Configs.findOne({Name: data[i].Name}) == null) {
				Configs.insert(data[i]);
			}
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

	return user;
});
