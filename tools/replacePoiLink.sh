# $1 -> map ID
# $2 -> text to be replaced in POI link
# $3 -> text to replace it with
# $4 -> word "update" if queue update needed

export WIKIA_CONFIG_ROOT="/usr/wikia/source/config"
export WIKIA_SWIFT_YML="/usr/wikia/source/config/Swift.yml"
export WIKIA_PROD_DATACENTER="sjc"
export NODE_ENV="production"
eval "node replacePoiLinkUrl.js $1 $2 $3"