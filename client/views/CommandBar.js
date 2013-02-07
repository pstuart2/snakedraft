Template.CommandBar.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.CommandBar.events({
	"click a.randomize-draft": function(e) {
		e.preventDefault();
		Meteor.call("randomizeDraftees");
	}
});
