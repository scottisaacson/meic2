export ACCESS_TOKEN=`cat /Users/scottike/SPX/.access`
export ACCOUNT_HASH=`cat /Users/scottike/SPX/.hashvalue`
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

export queryEncoded='orders?maxResults=20&fromEnteredTime=2024-11-19T00%3A00%3A00.000Z&toEnteredTime=2024-11-20T00%3A00%3A00.000Z'

echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"
curl -v -X 'GET' \
  "https://api.schwabapi.com/trader/v1/accounts/${ACCOUNT_HASH}/${queryEncoded}" \
  -H 'accept: application/json' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

