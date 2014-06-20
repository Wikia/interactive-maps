INSERT INTO tile_set SET
id = 1,
name = 'Geo Map',
type = 'map_quest',
url = 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
image = '',
width = 524288,
height = 524288,
min_zoom = 0,
max_zoom = 524287,
status = 0,
created_on = '2014-01-01 12:00:00',
created_by = 'Wikia',
attribution = '© OpenStreetMap contributors | <p>Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png"></p>',
subdomains = '1234';


INSERT INTO poi_category VALUES
(1, 'Location', NULL, NULL, 0, 0, 1, 1, '2014-01-01 12:00:00', 'Wikia'),
(2, 'Quest', NULL, NULL, 0, 0, 1, 2, '2014-01-01 12:00:00', 'Wikia'),
(3, 'Character', NULL, NULL, 0, 0, 1, 3, '2014-01-01 12:00:00', 'Wikia'),
(4, 'Item', NULL, NULL, 0, 0, 1, 4, '2014-01-01 12:00:00', 'Wikia'),
(5, 'Event', NULL, NULL, 0, 0, 1, 5, '2014-01-01 12:00:00', 'Wikia'),
(6, 'Other', NULL, NULL, 0, 0, 1, 6, '2014-01-01 12:00:00', 'Wikia');
