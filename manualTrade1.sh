export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date | sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

cd /Users/scottike/WebstormProjects/meic1
node manualTrade1.js





