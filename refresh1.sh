export CREDS="QzJiRGdWVE9QWVBtU3Y0QTh6ZnJBNklGRTMxQTMxVU86azZxTWdUeU1Wc0NYUTNYMA=="
export BEARER_TOKEN='I0.b2F1dGgyLmJkYy5zY2h3YWIuY29t.-_jzzVAVfC9PGbUi3-ehNbYtWzIm3VuiEZoH2-0rRD8@'
export DATE='2024-10-30'
export TIME_STAMP=`date | cut -d ' ' -f4 | sed -e "s/:/-/g"`
echo ${TIME_STAMP}
mkdir /Users/scottike/SPX/data/${DATE}


curl -X 'GET' \
  "https://api.schwabapi.com/marketdata/v1/chains?symbol=%24SPX&contractType=ALL&strikeCount=50&includeUnderlyingQuote=true&strategy=SINGLE&fromDate=${DATE}&toDate=${DATE}" \
  -H 'accept: application/json' \
  -H "Authorization: Bearer ${BEARER_TOKEN}" > /Users/scottike/SPX/data/${DATE}/${TIME_STAMP}.json

