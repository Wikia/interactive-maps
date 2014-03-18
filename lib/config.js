module.exports = {
	db: {
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'interactive_maps'
	},
	minZoom: 0,
	maxZoom: 5,
	firstBatchZoomLevels: 3,
	optimize: true,
	cleanup: true,
	redis: {
		port: 6379,
		host: 'localhost',
		password: ''
	},
	kue: {
		port: 3001,
		title: 'Interactive Maps Queue',
		maxFetchJobs: 1,
		maxCutTilesJobs: 1
	}
};
