-- DROP DATABASE IF EXISTS interactive_maps;

START TRANSACTION;

CREATE DATABASE IF NOT EXISTS interactive_maps;

USE interactive_maps;

-- TODO: make sure column names map somewhat to APIs


CREATE TABLE map (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  width MEDIUMINT UNSIGNED NOT NULL,
  height MEDIUMINT UNSIGNED NOT NULL,
  min_zoom TINYINT UNSIGNED NOT NULL,
  max_zoom TINYINT UNSIGNED NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL
);

CREATE TABLE map_instance (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  city_id INT UNSIGNED NOT NULL,
  map_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  locked TINYINT DEFAULT FALSE NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,

  FOREIGN KEY (map_id)
    REFERENCES map(id)
);

CREATE TABLE poi_category (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  marker VARCHAR(255),
  parent_poi_category_id INT UNSIGNED,
  city_id INT NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,

  FOREIGN KEY (parent_poi_category_id)
    REFERENCES poi_category(id)
);

CREATE TABLE poi (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  poi_category_id INT UNSIGNED NOT NULL,
  description TEXT,
  link TEXT,
  photo TEXT,
  lat FLOAT(10,6) NOT NULL,
  lon FLOAT(10,6) NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP,
  updated_by VARCHAR(255) NOT NULL,
  map_instance_id INT UNSIGNED NOT NULL,

  FOREIGN KEY (poi_category_id)
    REFERENCES poi_category(id),
  FOREIGN KEY (map_instance_id)
    REFERENCES map_instance(id)
    ON DELETE CASCADE
);

-- TODO: figure out proper indexes
CREATE INDEX map ON map ( id );
CREATE INDEX map_city_id ON map_instance ( city_id );
CREATE INDEX poi_map ON poi ( map_instance_id );

COMMIT;