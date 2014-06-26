'use strict';

var FlightPlan = require('flightplan'),
	fs = require('fs'),
	config = require('./lib/config'),
	applicationName = 'interactive-maps',
	now = new Date().getTime(),
	build = applicationName + '-' + now,
	archive = build + '.tar.gz',
	cacheBusterFileName = __dirname + '/cachebuster.json',
	plan = new FlightPlan(),
	briefing;

/**
 * Setup flight briefing
 * @param {object} destinations
 * @returns {object}
 */
function setupBriefing(destinations) {
	var briefing = {
			debug: true,
			destinations: {}
		},
		agent = process.env.SSH_AUTH_SOCK;
	Object.keys(destinations).forEach(function (key) {
		if (!briefing.destinations.hasOwnProperty(key)) {
			briefing.destinations[key] = [];
		}
		destinations[key].forEach(function (machine) {
			machine.agent = agent;
			briefing.destinations[key].push(machine);
		});
	});
	return briefing;
}

/**
 * Creates cache buster file
 * @param {string} fileName
 * @param {object} transport
 */
function createCacheBuster(fileName, transport) {
	var cb = {
			cb: now
		},
		err = fs.writeFileSync(fileName, JSON.stringify(cb));
	if (err) {
		transport.abort(err);
	} else {
		transport.log('New cache buster ' + now + ' saved in ' + fileName);
	}
}

/**
 * Returns current git branch
 * @param {object} transport
 * @returns {string}
 */
function getCurrentBranch(transport) {
	var result = transport.exec('git rev-parse --abbrev-ref HEAD');
	if (result.code !== 0) {
		transport.abort('Error getting current branch: ' + result.stderr);
	}
	return result.stdout;
}

// Get machines setup from config
briefing = setupBriefing(config.flightPlan.destinations);

// Setup the flight
plan.briefing(briefing);

// Perform local operations
plan.local(function (local) {
	var branchName = getCurrentBranch(local);

	local.log('Install dependencies');
	local.exec('npm --production install');

	local.log('Run build on branch: ' + branchName);
	local.exec('gulp test');

	createCacheBuster(cacheBusterFileName, local);

	local.log('Creating build archive');
	local.exec('tar zcf /tmp/' + archive + ' . --exclude=.git');
	local.exec('mv /tmp/' + archive + ' ./');

	local.log('Copy files to remote hosts');
	local.transfer(archive, '/tmp');
});

// run commands on remote hosts (destinations)
plan.remote(function (remote) {
	var deployUser = config.flightPlan.deployUser,
		deployDirectory = config.flightPlan.deployDirectory;

	remote.log('Move folder to web root');
	remote.exec('mkdir ' + deployDirectory + build, {user: deployUser});
	remote.exec('tar zxf /tmp/' + archive + ' -C ' + deployDirectory + build, {user: deployUser});

	remote.rm('-rf /tmp/' + archive, {user: deployUser});

	remote.log('Reload application');
	remote.sudo('ln -snf ' + deployDirectory + build + ' ' + deployDirectory + applicationName, {user: deployUser});
	remote.sudo('service restart ' + applicationName, {user: deployUser});
});

plan.debriefing(function () {
	console.log('removing ' + archive);
	fs.unlinkSync('./' + archive);
});
