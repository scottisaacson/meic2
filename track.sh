export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date | sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

mkdir -p /Users/scottike/SPX/${DATE}/transactions

cd /Users/scottike/WebstormProjects/ikebot
node track.js


