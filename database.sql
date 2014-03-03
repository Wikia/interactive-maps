-- DROP DATABASE interactive_maps;
CREATE DATABASE IF NOT EXISTS interactive_maps;

USE interactive_maps;

-- TODO: make sure column names map somewhat to APIs

CREATE TABLE map (
  map_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(511) NOT NULL ,
  width INT(6) NOT NULL,
  height INT(6) NOT NULL,
  min_zoom INT(2) NOT NULL,
  max_zoom INT(2) NOT NULL
);

CREATE TABLE map_instance (
  map_instance_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  city_id INT NOT NULL,
  map_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  locked TINYINT DEFAULT 0 NOT NULL,
  foreign KEY (map_id) REFERENCES map(map_id)
);

CREATE TABLE poi_category (
  poi_category_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  parent INT,
  city_id INT NOT NULL,
  foreign KEY (parent) REFERENCES poi_category(poi_category_id)
);

CREATE TABLE poi (
  poi_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category INT NOT NULL,
  description LONGTEXT,
  link TEXT,
  photo TEXT,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  last_updated_on DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_updated_by VARCHAR(255) NOT NULL,
  map_instance_id INT NOT NULL,
  foreign KEY (map_instance_id) REFERENCES map_instance(map_instance_id),
  foreign KEY (category) REFERENCES poi_category(poi_category_id)
);

-- TODO: figure out proper indexes
CREATE INDEX map ON map ( map_id );
CREATE INDEX map_city_id ON map_instance ( city_id );
CREATE INDEX poi_map ON poi ( map_instance_id );
