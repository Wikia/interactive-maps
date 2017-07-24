Interactive Maps
================

> Since July 2017 **this service no longer runs on production**. See https://wikia-inc.atlassian.net/browse/SUS-2428 for more information.

Service that allows creating, storing and serving interactive maps


# Installation

```Shell
npm install
```
then export some env variables from `/etc/environment` file on our Wikia machines or do it by your own:
```Shell
export WIKIA_CONFIG_ROOT="<Path/To/ConfigFile>"
export WIKIA_SWIFT_YML="<Path/To/SwiftConfigFile>"
export WIKIA_DATACENTER="<datacenter>"
export NODE_ENV="<dev|prod>"
```

Optionally you can define the number of background workers:
```Shell
export WIKIA_IM_WORKERS=4
```

then you can run it
```Shell
gulp
```
or
```Shell
node app.js
```

# What is it ?

Interactive maps are maps alike google or bing maps, but can be created by our users. They can upload their own images that we will be cut into tiles and than they can​ add POIs to them. Map tiles will be shared across wikis, and map instances (map tiles associated with POIs) will be per wiki. Each POI (Point of Interest) will have ​its title, description and a link (most probably those links will be to articles on a given wiki). So with that tool users will be able to create maps of their favourite levels, places, cities and more!
