Meteor.subscribe("users");

Template.Users.ActiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$gt: 0}}, {sort: {username: 0}});
};

Template.Users.InactiveUserArr = function() {
	return Meteor.users.find({"profile.hoursLeft": {$lte: 0}}, {sort: {username: 0}});
};

Template.Users.events({
	"dblclick li.user-item": function() {
		Session.set("editUserId", this._id);
		Template.EditUser.Show();
	}
});
