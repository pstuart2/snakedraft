Session.set("editUserId", null);

Template.EditUser.Show = function() {
	var editId = Session.get("editUserId");
	if (editId) {
		Meteor.flush();
		$("#editUserModal").modal("show");
	}
};

Template.EditUser.User = function() {
	var user = Meteor.users.findOne({_id: Session.get("editUserId")}),
			hoursInDay = parseInt(Configs.findOne({Name: "HoursPerDay"}).Value),
			tmp;
	if (user) {
		tmp = hoursToDaysHours(user.profile.hoursAssigned);
		user.assignedHours = tmp.hours;
		user.assignedDays = tmp.days;

		tmp = hoursToDaysHours(user.profile.totalHoursAvailable);
		user.availableHours = tmp.hours;
		user.availableDays = tmp.days;
	}
	return user;
};

Template.EditUser.checkChecked = function(isTrue) {
	return isTrue ? "checked" : "";
};

// We need the toggle so that it will re-render.
Template.EditUser.EditingUser = function() {
	return !Session.equals("editUserId", null);
};

Template.EditUser.events = {
	"click button.save-custom-ticket": function() {
		var ticket = $("#ticket"),
				title = $("#title"),
				days = $("#days"),
				hours = $("#hours"),
				desc = $("#description"),
				hourEstimate = parseInt(hours.val()),
				dayEstimate = parseInt(days.val()),
				hoursInDay = parseInt(Configs.findOne({Name: "HoursPerDay"}).Value);

		if (!hourEstimate) { hourEstimate = 0; }
		if (!dayEstimate) { dayEstimate = 0; }
		hourEstimate += dayEstimate * hoursInDay;
		//dayEstimate = parseInt(hourEstimate / hoursInDay);
		//hourEstimate = hourEstimate - (dayEstimate * hoursInDay);

		Tickets.insert({
			Id: ticket.val(),
			Title: title.val(),
			//Days: dayEstimate,
			Hours: hourEstimate,
			Description: desc.val()
		});

		ticket.val(null);
		title.val(null);
		days.val(null);
		hours.val(null);
		desc.val(null);

		Session.set("editUserId", null);
	}
};
