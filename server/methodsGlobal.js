draftTimerInterval = null;
cipherKey = 'n33ds0mehintbet1';
cipherIv = '5622587455896325';
cipherType = 'aes-128-cbc';

/**
 * Gets a json object from Jira.
 *
 * @param query
 * @return {*}
 */
function getJiraObject(query)
{
	var JiraRestUrl = Configs.findOne({Name: "JiraRestUrl"}).Value;
	console.log("JiraRestUrl: " + JiraRestUrl);
	return callJira("GET", JiraRestUrl + query);
}

/**
 * Makes a call to Jira.
 *
 * @param type
 * @param url
 * @return {*}
 */
function callJira(type, url) {
	//var jiraUser = decryptValue(Configs.findOne({Name: "JiraCredentials"}).Value);

	var jiraUser = Configs.findOne({Name: "JiraCredentials"}).Value;

	console.log("Calling Jira: " + jiraUser);
	console.log("Calling url : " + url);

	var result = Meteor.http.call(type, url, {
		timeout: 30000,
		auth: jiraUser,
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (result.content.substr(0, 1) == "<") {
		console.log(result.content);
		return false;
	}

	console.log("Leaving callJira");
	return JSON.parse(result.content);
}

/**
 * Adds a ticket to the system from a Jira ticket object.
 *
 * @param ticket
 */
function addJiraTicket(ticket)
{
	if (ticket) {
		console.log("Ticket: " + ticket.key);

		var hours = 0,
				qaHours = 0;
		if (ticket.fields.timetracking != null) {
			hours = secondsToHours(ticket.fields.timetracking.originalEstimateSeconds);
		} else if (ticket.fields.progress != null) {
			hours = secondsToHours(ticket.fields.progress.total);
		}

		if (ticket.fields.customfield_10190 != null) {
			qaHours = ticket.fields.customfield_10190;
		}

		addTicket(ticket.key, ticket.fields.summary, ticket.fields.description, hours, qaHours);
	}
}

/**
 * Encrypts a value.
 *
 * @param value
 * @return {*|Progress}
 */
function encryptValue(value)
{
	var crypto = require('crypto'),
			cipher = crypto.createCipheriv(cipherType, cipherKey, cipherIv),
			crypted = cipher.update(value, 'utf-8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}

/**
 * Decrypts a value.
 *
 * @param value
 * @return {*|Progress}
 */
function decryptValue(value)
{
	var crypto = require('crypto'),
			decipher = crypto.createDecipheriv(cipherType, cipherKey, cipherIv),
			decrypted = decipher.update(value, 'hex', 'utf-8');
	decrypted += decipher.final('utf-8');
	return decrypted;
}

/**
 * Converts total seconds to hours. Jira stores time in seconds,
 * we user hours.
 *
 * @param seconds
 * @return {Number}
 */
function secondsToHours(seconds) {
	return (seconds / 60 / 60);
}

/**
 * Adds a ticket to the database.
 *
 * @param Id
 * @param Title
 * @param Description
 * @param Hours
 * @param QaHours
 */
function addTicket(Id, Title, Description, Hours, QaHours) {
	var ticket = Tickets.findOne({Id: Id});
	if (!ticket) {
		Tickets.insert({Id: Id, Title: Title, Description: Description, Hours: parseInt(Hours), QaHours: parseInt(QaHours)});
	}
}

function createUserMessage(owner, message, type)
{
	UserMessages.insert({
		owner: owner,
		createdAt: (new Date()).getTime(),
		message: message,
		type: type
	})
}
