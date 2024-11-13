
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date | sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"

cd /Users/scottike/WebstormProjects/schwab-api-auth-automation
node ikerefresh1.js


