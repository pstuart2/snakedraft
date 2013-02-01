// This is executed in both client and server
var Configs = new Meteor.Collection("Configs");
var Tickets = new Meteor.Collection("Tickets");

/*if (Meteor.isClient) {
	Accounts.ui.config({
		passwordSignupFields: 'USERNAME_AND_EMAIL'
	});
}*/

function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
