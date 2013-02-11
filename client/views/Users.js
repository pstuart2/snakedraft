Session.set('selectedUserId', null);

Meteor.subscribe("users");

Template.Users.ActiveUserArr = function() {
	if (isDraftRunning()) {
		return Meteor.users.find({"profile.hoursLeft": {$gt: 0}}, {sort: {'profile.draftTurn': "asc"}});
	}
	return Meteor.users.find({"profile.hoursLeft": {$gt: 0}}, {sort: {'profile.draftPosition': "asc"}});
};

Template.Users.InactiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$lte: 0}}, {sort: {username: 0}});
};

Template.Users.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.Users.activeUserClass = function() {
	if (isDraftRunning() && isUserTurn(this._id)) {
		return "alert alert-success";
	}

	return "";
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
		var currentUser = Meteor.users.findOne({_id: Meteor.userId()});

		if (!currentUser.profile.isAdmin) {
			return;
		}

		Template.EditUser.Show(this._id);
	}
});
