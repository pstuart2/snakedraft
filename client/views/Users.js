Meteor.subscribe("users");

Template.Users.ActiveUserArr = function() {
	return Meteor.users.find({}, {sort: {username: 0}});
};

Template.Users.InactiveUserArr = function() {
	return Meteor.users.find({profile: {isAdmin: false}}, {sort: {username: 0}});
};

Template.Users.events({

});
