export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date | sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

mkdir -p /Users/scottike/SPX/${DATE}/omeic

cd /Users/scottike/WebstormProjects/meic1
node omeic1.js




