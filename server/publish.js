Meteor.publish("users", function() {
	return Meteor.users.find({}, {fields: {username: 1, profile: 1}});
});

Meteor.publish("Tickets", function() {
	return Tickets.find({});
});

Meteor.publish("Configs", function() {
	return Configs.find({});
});

Meteor.publish("Drafts", function() {
	return Drafts.find({});
});

Meteor.publish("Messages", function() {
	return Messages.find({});
});
