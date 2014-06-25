INSERT INTO tile_set SET
id = 1,
name = 'Geo Map',
type = 'map_quest',
url = 'http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',
image = 'default-geo.jpg',
width = 524288,
height = 524288,
min_zoom = 0,
max_zoom = 524287,
status = 0,
created_on = '2014-01-01 12:00:00',
created_by = 'Wikia',
attribution = '&copy; OpenStreetMap contributors | Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">',
subdomains = '1234';

INSERT INTO poi_category VALUES
(1, 'Other', NULL, NULL, NULL, 1, 1, '2014-01-01 12:00:00', 'Wikia'),
(2, 'Location', NULL, NULL, NULL, 1, 2, '2014-01-01 12:00:00', 'Wikia'),
(3, 'Quest', NULL, NULL, NULL, 1, 3, '2014-01-01 12:00:00', 'Wikia'),
(4, 'Character', NULL, NULL, NULL, 1, 4, '2014-01-01 12:00:00', 'Wikia'),
(5, 'Item', NULL, NULL, NULL, 1, 5, '2014-01-01 12:00:00', 'Wikia'),
(6, 'Event', NULL, NULL, NULL, 1, 6, '2014-01-01 12:00:00', 'Wikia');
