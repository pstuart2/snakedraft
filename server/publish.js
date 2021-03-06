Configs = new Meteor.Collection("Configs");
Tickets = new Meteor.Collection("Tickets");
Drafts = new Meteor.Collection("Drafts");
Messages = new Meteor.Collection("Messages");
UserMessages = new Meteor.Collection("UserMessage");

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
	update: function (userId, doc, fields, modifier) {
		// Only allow admins to update configs.
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
	},
	remove: function (userId, doc) {
		// No deletes.
		return false;
	}
});

Meteor.users.allow({
	insert: function (userId, doc) {
		// No inserts.
		return false;
	},
	update: function (userId, doc, fields, modifier) {
		// Only allow admins to update configs.
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		if (user.profile.isAdmin) return true;

		return doc._id === userId;
	},
	remove: function (userId, doc) {
		// No deletes.
		return false;
	}
});

// Only admins can modify the tickets.
Tickets.allow({
	insert: function (userId, doc) {
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
	},
	update: function (userId, doc, fields, modifier) {
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}}),
				draft = Drafts.findOne({});

		// Admins can update.
		if (user.profile.isAdmin) { return true; }

		// only when it is my turn can I updated assigned and only update it to me.
		if (draft.isRunning && draft.currentUser == userId) {
			// It is my turn, I can update assigned user.
			_.each(fields, function(field) {
				if (field != "AssignedUserId") {
					throw new Meteor.Error(100, "You cannot edit field: " + field);
				}

				// Make sure I am setting it to me.
				if (modifier.$set.AssignedUserId != userId) {
					throw new Meteor.Error(100, "You can only assign to yourself!");
				}

				// make sure I have the hours.
				if (user.profile.hoursAvailable < doc.Hours) {
					throw new Meteor.Error(302, "User doesn't have enough hours.");
				}
			});
		} else {
			// It is not my turn, I can update recommends.
			_.each(fields, function(field) {
				if (field != "recommends") {
					throw new Meteor.Error(100, "You cannot edit field: " + field);
				}
			});
		}

		console.log("Tickets returning true");
		return true;
	},
	remove: function (userId, doc) {
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
	}
});

Drafts.allow({
	insert: function (userId, doc) {
		// No inserts.
		return false;
	},
	update: function (userId, doc, fields, modifier) {
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		// Admin can update.
		if (user.profile.isAdmin) return true;

		// If it is not running and not my turn I cannot!
		if(!doc.isRunning || doc.currentUser != userId) {
			return false;
		}

		// I can only update certain fields!
		_.each(fields, function(field) {
			if (field != "remainingUserHours" &&
					field != "remainingTicketHours") {
				throw new Meteor.Error(100, "You cannot edit field: " + field);
			}
		});

		return true;
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
	update: function (userId, doc, fields, modifier) {
		// No Updates
		return false;
	},
	remove: function (userId, doc) {
		// No deletes.
		return false;
	}
});

UserMessages.allow({
	insert: function (userId, doc) {
		return false;
	},
	update: function (userId, doc, fields, modifier) {
		// No Updates
		return false;
	},
	remove: function (userId, doc) {
		return doc.owner !== userId;
	}
});
