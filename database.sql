-- DROP DATABASE IF EXISTS interactive_maps;

START TRANSACTION;

CREATE DATABASE IF NOT EXISTS interactive_maps CHARACTER SET utf8 COLLATE utf8_general_ci;

USE interactive_maps;

-- TODO: make sure column names map somewhat to APIs

CREATE TABLE tile_set (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  url VARCHAR(255) UNIQUE NOT NULL,
  image VARCHAR(255) NOT NULL,
  width MEDIUMINT UNSIGNED NOT NULL,
  height MEDIUMINT UNSIGNED NOT NULL,
  min_zoom INT UNSIGNED NOT NULL,
  max_zoom INT UNSIGNED NOT NULL, -- zoom levels saved in binary format 1011 - > zoom levels 4,2,1 so max that we can show is 2
  status TINYINT DEFAULT 0 NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL
);

CREATE TABLE map (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  city_id INT UNSIGNED NOT NULL,
  tile_set_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  locked TINYINT DEFAULT FALSE NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP,

  FOREIGN KEY (tile_set_id)
    REFERENCES tile_set(id)
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
  map_id INT UNSIGNED NOT NULL,

  FOREIGN KEY (poi_category_id)
    REFERENCES poi_category(id),
  FOREIGN KEY (map_id)
    REFERENCES map(id)
    ON DELETE CASCADE
);

-- TODO: figure out proper indexes
CREATE INDEX tile_set ON tile_set ( id );
CREATE UNIQUE INDEX tile_set_name_unq ON tile_set ( name );
CREATE INDEX map_city_id ON map ( city_id );
CREATE INDEX poi_map ON poi ( map_id );

COMMIT;
