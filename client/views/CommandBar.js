Template.CommandBar.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.CommandBar.events({

});
