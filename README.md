Interactive Maps
================

Service that allows creating, storing and serving interactive maps


# Installation

```Shell
npm install
```
and then
```Shell
export WIKIA_CONFIG_ROOT="Path/To/ConfigFile"
export WIKIA_CONFIG_ROOT="Path/To/ConfigFile"
gulp
```


+if (!process.env.WIKIA_CONFIG_ROOT) {
 +	throw 'WIKIA_CONFIG_ROOT seems to be not set';
 +}
 +
 +if (!process.env.WIKIA_SWIFT_YML) {
 +	throw 'WIKIA_SWIFT_YML seems to be not set';
 +}
 +
 +if (!process.env.WIKIA_PROD_DATACENTER) {
 +	throw 'WIKIA_PROD_DATACENTER seems to be not set';
 +}
 +
 +if (!process.env.NODE_ENV) {
 +	throw 'NODE_ENV seems to be not set';
 +}

# What is it ?

Interactive maps are maps alike google or bing maps, but can be created by our users. They can upload their own images that we will be cut into tiles and than they can​ add POIs to them. Map tiles will be shared across wikis, and map instances (map tiles associated with POIs) will be per wiki. Each POI (Point of Interest) will have ​its title, description and a link (most probably those links will be to articles on a given wiki). So with that tool users will be able to create maps of their favourite levels, places, cities and more!
