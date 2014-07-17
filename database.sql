-- DROP DATABASE IF EXISTS interactive_maps;

SET NAMES 'utf8';

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
  attribution VARCHAR(255) NOT NULL DEFAULT "",
  subdomains VARCHAR(15) NOT NULL DEFAULT "",
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE tile_set_search (
  id INT UNSIGNED PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  FULLTEXT (name)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

CREATE TABLE map (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  city_id INT UNSIGNED NOT NULL,
  city_title VARCHAR(255) NOT NULL,
  city_url VARCHAR(255) NOT NULL,
  tile_set_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  locked TINYINT DEFAULT FALSE NOT NULL,
  deleted TINYINT DEFAULT FALSE NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP,

  FOREIGN KEY (tile_set_id)
    REFERENCES tile_set(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE poi_category (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  marker VARCHAR(255) DEFAULT NULL,
  parent_poi_category_id INT UNSIGNED,
  map_id INT DEFAULT NULL,
  status TINYINT DEFAULT 0 NOT NULL,
  sort_order SMALLINT UNSIGNED DEFAULT 0 NOT NULL,
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by VARCHAR(255) NOT NULL,

  FOREIGN KEY (parent_poi_category_id)
    REFERENCES poi_category(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE poi (
  id INT UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  poi_category_id INT UNSIGNED NOT NULL,
  description TEXT,
  link TEXT,
  link_title VARCHAR(255),
  photo VARCHAR(255),
  lat FLOAT(10,6) NOT NULL,
  lon FLOAT(10,6) NOT NULL,
  created_on TIMESTAMP DEFAULT 0,
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  map_id INT UNSIGNED NOT NULL,

  FOREIGN KEY (poi_category_id)
    REFERENCES poi_category(id),
  FOREIGN KEY (map_id)
    REFERENCES map(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- TODO: figure out proper indexes
CREATE INDEX tile_set ON tile_set ( id );
CREATE INDEX tile_set_search_id ON tile_set_search ( id );
CREATE INDEX tile_set_status ON tile_set ( status );
CREATE INDEX tile_set_created_on ON tile_set ( created_on );
CREATE UNIQUE INDEX tile_set_name_unq ON tile_set ( name );
CREATE INDEX map_city_id ON map ( city_id );
CREATE INDEX poi_map ON poi ( map_id );

COMMIT;
