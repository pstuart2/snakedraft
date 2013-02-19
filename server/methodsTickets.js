Meteor.methods({
	///////////////////////////////////////////////////////////////////////////////
	// Ticket Functions
	///////////////////////////////////////////////////////////////////////////////
	/**
	 * As a user toggle ticket recommendation.
	 *
	 * @param userId
	 * @param recUsername
	 * @param ticketId
	 * @param isRec
	 */
	toggleRecTicket: function(userId, recUsername, ticketId, isRec) {
		var ticket = Tickets.findOne({_id: ticketId}),
				byUser = Meteor.users.findOne({_id: userId}),
				foundUser;

		if (!ticket.recommends) {
			ticket.recommends = [];
		}

		foundUser = _.find(ticket.recommends, function(rec) { return rec.user == recUsername; });
		if (foundUser) {
			foundUser.by = _.reject(foundUser.by, function(user) { return user.username == byUser.username; });
			if (isRec) {
				foundUser.by[foundUser.by.length] = {username: byUser.username};
			} else {
				if (foundUser.by.length == 0) {
					ticket.recommends = _.reject(ticket.recommends, function(rec) { return rec.user == recUsername; });
				}
			}
		} else {
			ticket.recommends[ticket.recommends.length] =
			{user: recUsername, by: [{username: byUser.username}]};
		}

		Tickets.update({_id: ticket._id},
				{$set: {recommends: ticket.recommends}},
				{multi: false});
	},

	/**
	 * Take a ticket when it is your turn.
	 *
	 * @param userId
	 * @param ticketId
	 * @return {Boolean}
	 */
	takeTicket: function (userId, ticketId) {
		var ticket, assignee, draft;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		assignee = getUser(userId);
		draft = Drafts.findOne({});

		if (!draft.currentUser == userId) {
			throw new Meteor.Error(302, "Not your turn.");
		}

		if (assignee.profile.totalHoursAvailable < ticket.Hours) {
			throw new Meteor.Error(302, "User doesn't have enough hours.");
		}


		assignTicketToUser(userId, ticketId, ticket.Hours);
		draftChangeTurn();

		return true;
	},

	/**
	 * As an admin assign a ticket to a user.
	 *
	 * @param userId
	 * @param ticketId
	 */
	assignTicket: function(userId, ticketId) {
		var ticket, currentUser, draft;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		currentUser = getUser(Meteor.userId());
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "You cannot assign tickets.");
		}

		assignTicketToUser(userId, ticketId, ticket.Hours);

		// If the draft is running, it is this users turn and we assign it
		// then switch turns.
		draft = Drafts.findOne({});
		if (draft.isRunning && draft.currentUser == userId) {
			draftChangeTurn();
		}
	},

	/**
	 * As an admin un-assign tickets from a user.
	 *
	 * @param ticketId
	 */
	unassignTicket: function(ticketId) {
		var ticket, currentUser;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		currentUser = getUser(Meteor.userId());
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "You cannot assign tickets.");
		}

		Tickets.update({_id: ticketId},
				{$unset: {AssignedUserId: 1}},
				{multi: false});

		Meteor.users.update({_id: ticket.AssignedUserId},
				{$inc: {'profile.hoursLeft': ticket.Hours, 'profile.hoursAssigned': -ticket.Hours}},
				{multi: false});
	},

	/**
	 * Deletes a ticket from the system.
	 *
	 * @param ticketId
	 */
	deleteTicket: function(ticketId) {
		var ticket, currentUser;

		ticket = Tickets.findOne({_id: ticketId});
		if (ticket == null) {
			throw new Meteor.Error(404, "Can't find ticket.");
		}

		currentUser = getUser(Meteor.userId());
		if (!currentUser.profile.isAdmin) {
			throw new Meteor.Error(302, "You cannot delete tickets.");
		}

		Tickets.remove({_id: ticketId});
	}
});
