
Template.EditUser.rendered = function() {
	SessionAmplify.setDefault("editUserId", null);
};

Template.EditUser.Show = function(editId) {
	if (editId) {
		SessionAmplify.set("editUserId", editId);
		Meteor.flush();
		$("#editUserModal").modal("show");
	}
};

Template.EditUser.User = function() {
	var user = Meteor.users.findOne({_id: SessionAmplify.get("editUserId")}),
			tmp;
	if (user) {
		tmp = hoursToDaysHours(user.profile.hoursAssigned);
		user.assignedHours = tmp.hours;
		user.assignedDays = tmp.days;

		tmp = hoursToDaysHours(user.profile.hoursAvailable);
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
	return !SessionAmplify.equals("editUserId", null);
};

Template.EditUser.events = {
	"click button.edit-user-save": function() {
		var availableDays = $("#editUser-available-days"),
				availableHours = $("#editUser-available-hours"),
				assignedDays = $("#editUser-assigned-days"),
				assignedHours = $("#editUser-assigned-hours"),
				draftPosition = $("#editUser-draft-position"),
				isAdmin = ($("#editUser-is-admin").attr("checked") == "checked"),
				totalAssignedHours,
				totalAvailableHours;

		totalAssignedHours = hoursDaysToTotalHours(assignedHours.val(), assignedDays.val());
		totalAvailableHours = hoursDaysToTotalHours(availableHours.val(), availableDays.val());

		var currentUser = getUser(SessionAmplify.get("editUserId")),
				intDraftPos = parseInt(draftPosition.val());

		// Update our user.
		Meteor.users.update({_id: SessionAmplify.get("editUserId")},
				{
					$set: {
						'profile.isAdmin': isAdmin,
						'profile.hoursAvailable': totalAvailableHours,
						'profile.hoursAssigned': totalAssignedHours,
						'profile.hoursLeft': totalAvailableHours - totalAssignedHours
					}
				},
				{multi: false});

		// Check to see if our draft position changed...
		if (currentUser.profile.draftPosition != intDraftPos) {
			movePeep(SessionAmplify.get("editUserId"), intDraftPos);
		}

		Meteor.call("checkHoursVsTicketHours", function(e, d) {
			if (e) {
				alertify.error(e.reason);
			}
		});


		SessionAmplify.set("editUserId", null);
	}
};
