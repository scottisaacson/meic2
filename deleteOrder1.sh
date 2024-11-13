export ACCESS_TOKEN=`cat /Users/scottike/SPX/.access`
export ACCOUNT_HASH=`cat /Users/scottike/SPX/.hashvalue`
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

export ORDER_ID="1002152079426"
echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"

curl -v -X 'DELETE' \
  "https://api.schwabapi.com/trader/v1/accounts/${ACCOUNT_HASH}/orders/${ORDER_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

