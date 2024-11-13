export ACCESS_TOKEN=`cat /Users/scottike/SPX/.access`

export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date | sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"

curl -s -X 'GET' \
  "https://api.schwabapi.com/trader/v1/accounts?fields=positions" \
  -H 'accept: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"







