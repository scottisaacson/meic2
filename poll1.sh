export BEARER_TOKEN=`cat /Users/scottike/SPX/.access`
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

mkdir -p /Users/scottike/SPX/${DATE}/data

# start = 07-30-00 = 27000, end = 13:59:59 = 50399

START_TIME=27000
END_TIME=50399
#END_TIME=86340
MYH=`echo ${TIME_STAMP} | cut -d '-' -f1`
MYM=`echo ${TIME_STAMP} | cut -d '-' -f2`
MYS=`echo ${TIME_STAMP} | cut -d '-' -f3`
XH=`expr $MYH \* 3600`
XM=`expr $MYM \* 60`
XS=`expr $MYS`
X=`expr $XH + $XM + $XS`

if [[ "$X" -ge "$START_TIME" && "$X" -le "$END_TIME" ]]; then
  echo "==========================================="
  echo "Date: ${DATE}, Time: ${TIME_STAMP}"
  curl -s -X 'GET' \
    "https://api.schwabapi.com/marketdata/v1/chains?symbol=%24SPX&contractType=ALL&strikeCount=50&includeUnderlyingQuote=true&strategy=SINGLE&fromDate=${DATE}&toDate=${DATE}" \
    -H 'accept: application/json' \
    -H "Authorization: Bearer ${BEARER_TOKEN}" > /Users/scottike/SPX/${DATE}/data/${TIME_STAMP}.json
  cp /Users/scottike/SPX/${DATE}/data/${TIME_STAMP}.json /Users/scottike/SPX/${DATE}/data/now.json
else
  echo WAITING for the trading day to open
fi




