'use strict';

var FlightPlan = require('flightplan'),
	fs = require('fs'),
	config = require('./lib/config'),
	applicationName = 'interactive-maps',
	now = new Date().getTime(),
	tmpDir = applicationName + '-' + now,
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
			debug: false,
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
	};
	fs.writeFile(fileName, JSON.stringify(cb), function (err) {
		if (err) {
			transport.abort(err);
		} else {
			transport.log('New cache buster ' + now + ' saved in ' + fileName);
		}
	});
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
	var branchName = getCurrentBranch(local),
		filesToCopy;
	local.log('Run build on branch: ' + branchName);
	local.exec('gulp test');

	local.log('Install dependencies');
	local.exec('npm --production install');

	createCacheBuster(cacheBusterFileName, local);

	local.log('Copy files to remote hosts');
	filesToCopy = local.git('ls-files', {silent: true});
	// Copy deployment files to tmp
	local.transfer(filesToCopy, '/tmp/' + tmpDir);
});

// run commands on remote hosts (destinations)
plan.remote(function (remote) {
	var deployUser = config.flightPlan.deployUser,
		deployDirectory = config.flightPlan.deployDirectory;

	if (plan.target.destination === 'production') {
		var input = remote.prompt('Ready for deploying to production? [yes]');
		if (input.indexOf('yes') === -1) {
			remote.abort('user canceled flight');
		}
	}
	remote.log('Move folder to web root');
	remote.sudo('cp -R /tmp/' + tmpDir + ' ' + deployDirectory, {user: deployUser});
	remote.rm('-rf /tmp/' + tmpDir);

	remote.log('Reload application');
	remote.sudo('ln -snf ' + deployDirectory + tmpDir + ' ' + deployDirectory + applicationName, {user: deployUser});
	remote.sudo('service restart ' + applicationName, {user: deployUser});
});
