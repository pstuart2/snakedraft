Template.AddJiraTicket.events = {
	"click button.add-jira-tickets": function() {
		var ticket = $("#tickets");

		Meteor.call("addJiraTickets", ticket.val());
	}
};
