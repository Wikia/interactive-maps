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
created_on = CURRENT_TIMESTAMP,
created_by = 'Wikia',
attribution = 'TBD', -- TODO Add proper attribution here
subdomains = '1234';

INSERT INTO poi_category SET
id = 1,
name = 'Others';