Template.CommandBar.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.CommandBar.events({
	"click button.add-custom-ticket": function() {
		$("#addTickets").toggle();
	},
	"click button.config": function() {
		$("#configs").toggle();
	}
});
