
export DATE_DESIRED=`cat /Users/scottike/SPX/.date`

if [[ "${DATE_DESIRED}" -eq "today" ]]; then
  export DATE=$(date +"%Y-%m-%d")
else
  export DATE=${DATE_DESIRED}
fi

mkdir -p /Users/scottike/SPX/${DATE}/data
mkdir -p /users/scottike/SPX/${DATE}/options
mkdir -p /Users/scottike/SPX/${DATE}/omeic
mkdir -p /Users/scottike/SPX/${DATE}/transactions
mkdir -p /Users/scottike/SPX/${DATE}/positions

find /Users/scottike/SPX/${DATE} -type d




