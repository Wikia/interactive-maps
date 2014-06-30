'use strict';

var FlightPlan = require('flightplan'),
	fs = require('fs'),
	config = require('./lib/config'),
	applicationName = 'interactive-maps',
	now = new Date().getTime(),
	build = applicationName + '-' + now,
	archive = build + '.tar.gz',
	cacheBusterFileName = __dirname + '/cachebuster.json',
	currentBuildName = 'current',
	deployBranch = 'master',
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
	return result.stdout.trim();
}

// Get machines setup from config
briefing = setupBriefing(config.flightPlan.destinations);

// Setup the flight
plan.briefing(briefing);

// Perform local operations
plan.local(function (local) {
	var branchName = getCurrentBranch(local);

	if (branchName !== deployBranch) {
		var input = local.prompt('Are you sure you want to deploy branch "' + branchName + '"? [yes]');
		if (input.indexOf('yes') === -1) {
			local.abort('user canceled flight');
		}
	}

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

	local.log('Remove local copy of archive');
	local.exec('rm ./' + archive);
});

// run commands on remote hosts (destinations)
plan.remote(function (remote) {
	var deployDirectory = config.flightPlan.deployDirectory;

	remote.log('Extract build files to: ' + deployDirectory + build);
	remote.exec('mkdir ' + deployDirectory + build);
	remote.exec('tar zxf /tmp/' + archive + ' -C ' + deployDirectory + build);

	remote.log('Remove build archive');
	remote.exec('rm -rf /tmp/' + archive);

	remote.log('Create symbolic link: ' + deployDirectory + build + ' -> ' + deployDirectory + applicationName);
	remote.exec('ln -snf ' + deployDirectory + build + ' ' + deployDirectory + currentBuildName);

	remote.log('Restart application');
	remote.exec('sudo sv restart ' + applicationName);
});

plan.debriefing(function () {
	var archiveFile = './' + archive;
	if (fs.existsSync(archiveFile)) {
		console.log('Removing ' + archive);
		fs.unlinkSync(archiveFile);
	}
});
