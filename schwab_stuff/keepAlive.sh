#!/bin/bash


# Define the command you want to run
command_to_run="./ikerefresh1.sh"

# Run the command every 25 minutes indefinitely
while true; do

    # Execute the command
    $command_to_run

    # Wait for 10 minutes (600 seconds) before running again
    sleep 600
done