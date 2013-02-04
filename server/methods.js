Meteor.methods({
	takeTicket: function (userId, ticketId) {
		var ticket, user, hours;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		hours = ticket.Hours;
		user = Meteor.users.findOne({_id: userId}, {fields: {username: 1, profile: 1}});
		if (user.profile.totalHoursAvailable < ticket.Hours) {
			throw new Meteor.Error(404, "User doesn't have enough hours.");
		}

		Tickets.update({_id: ticketId},
				{$set: {AssignedUserId: userId}},
				{multi: false});

		console.log("Hours: " + hours);
		Meteor.users.update({_id: userId},
				{$inc: {'profile.hoursLeft': -hours, 'profile.hoursAssigned': hours}},
				{multi: false});

		return true;
	}
});
