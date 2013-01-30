Template.Config.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.Config.events = {
	"click button.config": function() {
		$("#configs").toggle();
	},
	"click button.add-config": function() {
		var name = $("#name"),
				value = $("#value");

		Configs.insert({Name: name.val(), Value: value.val()});

		name.val(null);
		value.val(null);
	}
};
