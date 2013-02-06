Session.set('selectedUserId', null);

Meteor.subscribe("users");
Meteor.subscribe("Drafts");

Template.Users.ActiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$gt: 0}}, {sort: {'profile.draftPosition': 0}});
};

Template.Users.InactiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$lte: 0}}, {sort: {username: 0}});
};

Template.Users.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.Users.isDraftRunning = function() {
	return isDraftRunning();
};

Template.Users.DraftTimer = function() {
	return Drafts.findOne({});
};

Template.Users.selected = function () {
	return Session.equals('selectedUserId', this._id) ? 'user-selected' : '';
};

Template.Users.events({
	"click li.user-item": function() {
		if (Session.equals('selectedUserId', this._id))
		{
			Session.set('selectedUserId', null);
		} else {
			Session.set('selectedUserId', this._id);
		}
	},

	"dblclick li.user-item": function() {
		Template.EditUser.Show(this._id);
	}
});
