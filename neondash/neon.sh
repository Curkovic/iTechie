#!/usr/bin/env bash

export DASH_VERSION="0.1"
export SYSTEM_STATUS="ONLINE"
export CPU_LOAD=$(top -bn2 | grep "Cpu(s)" | tail -1 | sed 's/,/./g' | awk '{print 100 - $8}')
export RAM_USED=$(free -g | grep Mem | awk '{print $3}')
export RAM_TOTAL=$(free -g | grep Mem | awk '{print $2}')


#Create index.html

envsubst < index.html.template > index.html
