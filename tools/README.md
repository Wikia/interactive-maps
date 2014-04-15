# TOOLS
This directory contains maintenance and monitoring tools for the Interactive maps service.

## Nagios monitoring

Scripts to be used with [Nagios](http://www.nagios.org/). Both scripts require the correct environment variables to be set to work. For reference, please check this [README](https://github.com/Wikia/interactive-maps/blob/master/README.md).

Exit codes defined for [Nagios](http://www.nagios.org/) scripts are:

    exitCodes = {
		'OK': 0,
		'WARNING': 1,
		'CRITICAL': 2,
		'UNKNOWN': 3
	},

### nagiosQueueSize.js

This script checks the task queue size and returns result code and message depending on the values defined in the `inactiveThresholds` object in the script. Values in the object represent waiting tasks. In case of general error, `CRITICAL` result is raised.

The result message includes current number of waiting tasks in the queue.

### nagiosApiHeartBeat.js

This scripts creates HTTP requests to the `/heartbeat` entry point on the API server. If HTTP error occurs `CRITICAL` result is raised with message containing the HTTP error message.

In case of normal HTTP response (200), the response time is measured (in milliseconds) and response code is returned, depending on the threshold values defined in `responseTimeThresholds`. The values are also defined in ms.

The default hostname to check is `localhost`, but this can be modified, if required by changing the `hostnameToCheck` variable.

The return message contains the actual number of ms, that took to make the request.
