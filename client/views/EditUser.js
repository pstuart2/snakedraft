Session.set("editUserId", null);

Template.EditUser.Show = function(editId) {
	if (editId) {
		Session.set("editUserId", editId);
		Meteor.flush();
		$("#editUserModal").modal("show");
	}
};

Template.EditUser.User = function() {
	var user = Meteor.users.findOne({_id: Session.get("editUserId")}),
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
	return isTrue ? 'checked="checked"' : "";
};

// We need the toggle so that it will re-render.
Template.EditUser.EditingUser = function() {
	return !Session.equals("editUserId", null);
};

Template.EditUser.events = {
	"click button.edit-user-save": function() {
		var availableDays = $("#editUser-available-days"),
				availableHours = $("#editUser-available-hours"),
				assignedDays = $("#editUser-assigned-days"),
				assignedHours = $("#editUser-assigned-hours"),
				isAdmin = ($("#editUser-is-admin").attr("checked") == "checked"),
				totalAssignedHours,
				totalAvailableHours;

		totalAssignedHours = hoursDaysToTotalHours(assignedHours.val(), assignedDays.val());
		totalAvailableHours = hoursDaysToTotalHours(availableHours.val(), availableDays.val());

		Meteor.call("editUser", Session.get("editUserId"),
				{
					'profile.isAdmin': isAdmin,
					'profile.totalHoursAvailable': totalAvailableHours,
					'profile.hoursAssigned': totalAssignedHours
				}
		);

		Session.set("editUserId", null);
	}
};
