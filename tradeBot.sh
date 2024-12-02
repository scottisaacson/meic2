#!/bin/bash

#times=("09:13" "09:28" "09:43" "09:58" "10:13" "10:28")
#times=("10:58" "11:28" "11:43" "12:13" "12:28" "12:43")
times=("10:58" "11:13" "11:28" "11:43" "11:58" "12:13")
#echo "${times[@]}"


cd /Users/scottike/WebstormProjects/ikebot

# The command you want to run
# command="./recommend.sh"
# command='echo "Manually run poll.sh then recommend.sh"'
# command="./placeTOSOrders.sh"
command="./recommend.sh"

while true; do
    # Get the current time in HH:MM format
    current_time=$(date +"%H:%M")
    echo "TradeBot Time = ${current_time}"
    echo "${times[@]}"

    # Check if the current time matches any of the specified times
    for time in "${times[@]}"; do
        if [ "$current_time" == "$time" ]; then
            echo "Running command at $current_time"
            eval $command

            # Wait a minute to avoid running the command multiple times within the same minute
            sleep 60
        fi
    done

    # Sleep for a short period to prevent excessive CPU usage
    sleep 10
done
