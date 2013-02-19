Session.set('selectedUserId', null);

Meteor.subscribe("users");

Template.Users.ActiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$gt: 0}}, {sort: {'profile.draftPosition': 1}});
};

Template.Users.InactiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$lte: 0}}, {sort: {'profile.draftPosition': 1}});
};

Template.Users.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.Users.remainingHoursFormat = function() {
	return formatTotalHours(this.profile.totalHoursAvailable - this.profile.hoursAssigned)
};

Template.Users.imaAdmin = function() {
	return Meteor.user() != null && Meteor.user().profile.isAdmin;
};

Template.Users.activeUserClass = function() {
	if (isDraftRunning() && isUserTurn(this._id)) {
		return "alert alert-success";
	}

	return "";
};

Template.Users.finishedHoursLabel = function () {
	var cssClass = "label-inverse";

	if (this.profile.totalHoursAvailable < this.profile.hoursAssigned)
	{
		cssClass = "label-important";
	}

	return cssClass;
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

	"click i.icon-edit": function() {
		if (!Meteor.user().profile.isAdmin) {
			return;
		}

		Template.EditUser.Show(this._id);
	}
});
