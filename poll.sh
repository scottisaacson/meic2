export ACCESS_TOKEN=`cat ${SPX_HOME}/.access`
export DATE_DESIRED=`cat ${SPX_HOME}/.date`
if [[ "${DATE_DESIRED}" -eq "today" ]]; then
  export DATE=$(date +"%Y-%m-%d")
else
  export DATE=${DATE_DESIRED}
fi
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

# start = 07-30-00 = 27000, end = 13-59-59 = 50399

START_TIME=27000
END_TIME=50399
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
  echo "calling..."
  cd /Users/scottike/WebstormProjects/ikebot
  node poll.js
  echo "...done"
else
  echo WAITING for the trading day to open
fi




