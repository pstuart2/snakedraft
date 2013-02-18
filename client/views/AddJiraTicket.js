Template.AddJiraTicket.events = {
	"click button.add-jira-tickets": function() {
		var ticket = $("#tickets"),
				filterId = $("#filterId");

		Meteor.call("addJiraTickets", ticket.val(), filterId.val());
	}
};
