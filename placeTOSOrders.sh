export ACCESS_TOKEN=`cat ${SPX_HOME}/.access`
export DATE_DESIRED=`cat ${SPX_HOME}/.date`
if [[ "${DATE_DESIRED}" -eq "today" ]]; then
  export DATE=$(date +"%Y-%m-%d")
else
  export DATE=${DATE_DESIRED}
fi
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

cd /Users/scottike/WebstormProjects/ikebot

./poll.sh
./recommend.sh
./createTOSOrder.sh
./postTOSPutSpread.sh
./postTOSCallSpread.sh

echo "Now login to TOS and check your orders!"





