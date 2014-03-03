-- DROP DATABASE interactive_maps;
CREATE DATABASE IF NOT EXISTS interactive_maps;

USE interactive_maps;

-- TODO: make sure column names map somewhat to APIs

CREATE TABLE map (
  map_id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(1024) NOT NULL ,
  width INT(6) UNSIGNED NOT NULL,
  height INT(6) UNSIGNED NOT NULL,
  min_zoom INT(2) UNSIGNED NOT NULL,
  max_zoom INT(2) UNSIGNED NOT NULL,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL
);

CREATE TABLE map_instance (
  map_instance_id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  city_id INT UNSIGNED NOT NULL,
  map_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  locked TINYINT DEFAULT 0 NOT NULL,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  foreign KEY (map_id) REFERENCES map(map_id)
);

CREATE TABLE poi_category (
  poi_category_id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  parent_poi_category_id INT UNSIGNED,
  city_id INT NOT NULL,
  foreign KEY (parent_poi_category_id) REFERENCES poi_category(poi_category_id)
);

CREATE TABLE poi (
  poi_id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category INT UNSIGNED NOT NULL,
  description TEXT,
  link TEXT,
  photo TEXT,
  x FLOAT(10,6) NOT NULL,
  y FLOAT(10,6) NOT NULL,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  updated_on DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  map_instance_id INT UNSIGNED NOT NULL,
  foreign KEY (map_instance_id) REFERENCES map_instance(map_instance_id),
  foreign KEY (category) REFERENCES poi_category(poi_category_id)
);

-- TODO: figure out proper indexes
CREATE INDEX map ON map ( map_id );
CREATE INDEX map_city_id ON map_instance ( city_id );
CREATE INDEX poi_map ON poi ( map_instance_id );
