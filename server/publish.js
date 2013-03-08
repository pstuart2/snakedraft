var Configs = new Meteor.Collection("Configs");
var Tickets = new Meteor.Collection("Tickets");
var Drafts = new Meteor.Collection("Drafts");
var Messages = new Meteor.Collection("Messages");
var UserMessages = new Meteor.Collection("UserMessage");

// Used for NodeJs require.
var require = null;

Meteor.publish("users", function() {
	return Meteor.users.find({}, {fields: {username: 1, profile: 1}});
});

Meteor.publish("Tickets", function() {
	return Tickets.find({});
	// return Tickets.find({owner: Meteor.userId()});
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

Meteor.publish("UserMessages", function() {
	// Publish messages just for me!
	return UserMessages.find({owner: this.userId}, {sort: {createdAt: 1}});
});

/**
 * These Allow / Deny rules control who can update the different collections (tables) from
 * the client.
 */
Configs.allow({
	insert: function (userId, doc) {
		// No inserts.
		return false;
	},
	update: function (userId, docs, fields, modifier) {
		// Only allow admins to update configs.
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
	},
	remove: function (userId, docs) {
		// No deletes.
		return false;
	}
});

// Only admins can modify the tickets.
Tickets.allow({
	insert: function (userId, doc) {
		return false;
	},
	update: function (userId, docs, fields, modifier) {
		return false;
	},
	remove: function (userId, docs) {
		return false;
	}
});

Drafts.allow({
	insert: function (userId, doc) {
		// No inserts.
		return false;
	},
	update: function (userId, docs, fields, modifier) {
		// Only allow admins to update configs.
		return false;
	},
	remove: function (userId, docs) {
		// No deletes.
		return false;
	}
});

Messages.allow({
	insert: function (userId, doc) {
		// Any one can insert.
		return true;
	},
	update: function (userId, docs, fields, modifier) {
		// No Updates
		return false;
	},
	remove: function (userId, docs) {
		// No deletes.
		return false;
	}
});

UserMessages.allow({
	insert: function (userId, doc) {
		return false;
	},
	update: function (userId, docs, fields, modifier) {
		// No Updates
		return false;
	},
	remove: function (userId, docs) {
		return ! _.any(docs, function (message) {
			// Deny if it is not my message.
			return message.owner !== userId;
		});
	}
});
