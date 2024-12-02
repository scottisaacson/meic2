export ACCESS_TOKEN=`cat /Users/scottike/SPX/.access`
export ACCOUNT_HASH=`cat /Users/scottike/SPX/.hashvalue`
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

#https://api.schwabapi.com/trader/v1/accounts/93EF51E01FE53D2177D42CCC33A4796F3C853777558CBEF0AA3564D47836DC8D/orders/1002260663765
#export ORDER_ID="1002152079426"
export ORDERID='1002260663765'

echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"

curl -v -X 'DELETE' \
  "https://api.schwabapi.com/trader/v1/accounts/${ACCOUNT_HASH}/orders/${ORDERID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

