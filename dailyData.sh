#!/bin/bash

# Prep the env
export DATE=$(date +"%Y-%m-%d")
export TIME_STAMP=`date | cut -d ' ' -f4 | sed -e "s/:/-/g"`


mkdir -p /Users/scottike/SPX/${DATE}/data
mkdir -p /Users/scottike/SPX/${DATE}/positions
mkdir -p /Users/scottike/SPX/${DATE}/omeic
mkdir -p /Users/scottike/SPX/${DATE}/transactions
mkdir -p /Users/scottike/SPX/${DATE}/options


cd /Users/scottike/WebstormProjects/ikebot

# Define the command you want to run
command_to_run="./poll.sh"

# Run the command every minute indefinitely
while true; do
    # Execute the command
    $command_to_run

    # Wait for 1 minutes (60 seconds) before running again
    sleep 60
done

