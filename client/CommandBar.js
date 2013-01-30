Template.TmplCommandBar.ConfigsArr = function() {
	return Configs.find({}, {sort: {Name: 1}});
};

Template.TmplCommandBar.events = {
	"click button.add-custom-ticket": function() {
		$("#addTickets").toggle();
	},
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				desc = $("#description");

		Tickets.insert({Id: ticket.val(), Title: title.val(), Description: desc.val()});
		$("#addTickets").hide();

		ticket.val(null);
		title.val(null);
		desc.val(null);
	},
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
