// This is executed in both client and server
var Configs = new Meteor.Collection("Configs");
var Tickets = new Meteor.Collection("Tickets");
var Drafts = new Meteor.Collection("Drafts");

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var __hoursPerDay = 0;
function hoursPerDay()
{
	if(__hoursPerDay == 0) {
		var hpd = Configs.findOne({Name: "HoursPerDay"});
		if(hpd) {
			__hoursPerDay = parseInt(hpd.Value);
		}
	}
	return __hoursPerDay;
}

function hoursToDaysHours(totalHours) {
	var hoursInDay = hoursPerDay(),
			result = {days: 0, hours: 0};

	result.hours = parseInt(totalHours);
	result.days = parseInt(result.hours / hoursInDay);
	result.hours = result.hours - (result.days * hoursInDay);

	return result;
}

function hoursDaysToTotalHours(hours, days) {
	var hoursInDay = hoursPerDay();
	return (parseInt(hours) + (parseInt(days) * hoursInDay));
}

function formatTotalHours(totalHours) {
	var result = hoursToDaysHours(totalHours);
	return result.days + "d " + result.hours + "h";
}

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
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
	},
	update: function (userId, docs, fields, modifier) {
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
	},
	remove: function (userId, docs) {
		var user = Meteor.users.findOne({_id: userId}, {fields: {profile: 1}});
		return user.profile.isAdmin;
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
