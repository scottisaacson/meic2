export DATE_DESIRED=`cat ${SPX_HOME}/.date`
if [[ "${DATE_DESIRED}" -eq "today" ]]; then
  export DATE=$(date +"%Y-%m-%d")
else
  export DATE=${DATE_DESIRED}
fi
export TIME_STAMP=`date |  sed -e "s/[ ][ ]*/ /g" | cut -d ' ' -f4 | sed -e "s/:/-/g"`

cd ${PROJECTS}/ikebot
node dumpTableau.js "${SPX_HOME}/${DATE}/data/now.json"





