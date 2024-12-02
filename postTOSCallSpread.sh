export ACCESS_TOKEN=`cat ${SPX_HOME}/.access`
export ACCOUNT_HASH=`cat ${SPX_HOME}/.hashvalue`
export DATE_DESIRED=`cat ${SPX_HOME}/.date`

if [[ "${DATE_DESIRED}" -eq "today" ]]; then
  export DATE=$(date +"%Y-%m-%d")
else
  export DATE=${DATE_DESIRED}
fi
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

echo "==========================================="
echo "Date: ${DATE}, Time: ${TIME_STAMP}"

curl -v -X 'POST' \
  "https://api.schwabapi.com/trader/v1/accounts/${ACCOUNT_HASH}/orders" \
  -H 'accept: */*' \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H 'Content-Type: application/json' \
  --data @"${SPX_HOME}/${DATE}/omeic/tosCallOrderBody.json"


