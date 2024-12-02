export ACCESS_TOKEN=`cat /Users/scottike/SPX/.access`
export ACCOUNT_HASH=`cat /Users/scottike/SPX/.hashvalue`
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"

curl -v -X 'POST' \
  "https://api.schwabapi.com/trader/v1/accounts/${ACCOUNT_HASH}/orders" \
  -H 'accept: */*' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data @myNetCreditSpread7.json

