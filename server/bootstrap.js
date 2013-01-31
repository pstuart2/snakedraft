// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	var data = [
		{Name: "JiraUrl", Value: "http://someurl.com"},
		{Name: "ScrumMaster", Value: ""}
	];

	if (Configs.find().count() != data.length) {
		for (var i = 0; i < data.length; i++) {
			if (Configs.findOne({Name: data[i].Name}) == null) {
				Configs.insert(data[i]);
			}
		}
	}
});
