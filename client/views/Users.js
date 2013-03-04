Meteor.subscribe("users");

Template.Users.rendered = function() {
	SessionAmplify.setDefault('selectedUserId', null);
};

Template.Users.ActiveUserArr = function() {
	return Meteor.users.find({'profile.isScrumMaster': false, "profile.hoursLeft": {$gt: 0}}, {sort: {'profile.draftPosition': 1}});
};

Template.Users.InactiveUserArr = function() {
	return Meteor.users.find({'profile.isScrumMaster': false, "profile.hoursLeft": {$lte: 0}}, {sort: {'profile.draftPosition': 1}});
};

Template.Users.formatTotalHours = function(totalHours) {
	return formatTotalHours(totalHours);
};

Template.Users.remainingHoursFormat = function() {
	return formatTotalHours(this.profile.hoursAvailable - this.profile.hoursAssigned)
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

Template.Users.showDraftPosition = function() {
	return false;
};

Template.Users.finishedHoursLabel = function () {
	var cssClass = "label-inverse";

	if (this.profile.hoursAvailable < this.profile.hoursAssigned)
	{
		cssClass = "label-important";
	}

	return cssClass;
};

Template.Users.selected = function () {
	return SessionAmplify.equals('selectedUserId', this._id) ? 'user-selected' : '';
};

Template.Users.events({
	"click li.user-item": function() {
		if (SessionAmplify.equals('selectedUserId', this._id))
		{
			SessionAmplify.set('selectedUserId', null);
		} else {
			SessionAmplify.set('selectedUserId', this._id);
		}
	},

	"click i.icon-edit": function() {
		if (!Meteor.user().profile.isAdmin) {
			return;
		}

		Template.EditUser.Show(this._id);
	}
});
