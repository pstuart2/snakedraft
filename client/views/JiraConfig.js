Meteor.subscribe("Configs");

Template.JiraConfig.config = function() {
	var obj = {};

	obj.JiraLinkUrl = Configs.findOne({Name: "JiraLinkUrl"});
	obj.JiraRestUrl = Configs.findOne({Name: "JiraRestUrl"});

	return obj;
};

Template.JiraConfig.events({
	"click button.save-jira-config": function() {
		var jiraLinkUrl = Configs.findOne({Name: "JiraLinkUrl"}),
				jiraRestUrl = Configs.findOne({Name: "JiraRestUrl"}),
				linkUrl = $("#JiraLinkUrlInp").val(),
				restUrl = $("#JiraRestUrlInp").val(),
				username = $("#JiraUsername").val(),
				password = $("#JiraPassword").val();

		Meteor.call("updateConfig", jiraLinkUrl._id, linkUrl);
		Meteor.call("updateConfig", jiraRestUrl._id, restUrl);
		Meteor.call("updateJiraCredentials", username, password);
	}
});
