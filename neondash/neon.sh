#!/usr/bin/env bash

export DASH_VERSION="0.1"
export SYSTEM_STATUS="ONLINE"
export CPU_LOAD=$(top -bn2 | grep "Cpu(s)" | tail -1 | sed 's/,/./g' | awk '{print 100 - $8}')
export RAM_USED=$(free -g | grep Mem | awk '{print $3}')
export RAM_TOTAL=$(free -g | grep Mem | awk '{print $2}')
export NET_UP=$(cat /sys/class/net/eno1/statistics/tx_bytes | awk '{print $1/1024/1024}')
export NET_DOWN=$(cat /sys/class/net/eno1/statistics/rx_bytes | awk '{print $1/1024/1024}')

#Create index.html

envsubst < index.html.template > index.html
