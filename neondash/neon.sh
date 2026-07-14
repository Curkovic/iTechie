#!/usr/bin/env bash

export DASH_VERSION="0.1"
export SYSTEM_STATUS="ONLINE"
export CPU_LOAD=$(top -bn2 | grep "Cpu(s)" | tail -1 | sed 's/,/./g' | awk '{print 100 - $8}')
export RAM_USED=$(free -g | grep Mem | awk '{print $3}')
export RAM_TOTAL=$(free -g | grep Mem | awk '{print $2}')
export NET_UP=$(cat /sys/class/net/eno1/statistics/tx_bytes | awk '{print $1/1024/1024}')
export NET_DOWN=$(cat /sys/class/net/eno1/statistics/rx_bytes | awk '{print $1/1024/1024}')
export DISK_OS_USED=$(df -h / | tail -1 | awk '{print $3"/"$2}')
export DISK_EXT_USED=$(df -h /media/mate/EXT | tail -1 | awk '{print $3"/"$2}')
# Network
export LOCAL_IP=$(hostname -I | awk '{print $1}')

# Processes (Using top to get the top 2 processes)
export P1_PID=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '2p' | awk '{print $1}')
export P1_NAME=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '2p' | awk '{print $4}')
export P1_CPU=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '2p' | awk '{print $2}')
export P1_MEM=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '2p' | awk '{print $3}')

export P2_PID=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '3p' | awk '{print $1}')
export P2_NAME=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '3p' | awk '{print $4}')
export P2_CPU=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '3p' | awk '{print $2}')
export P2_MEM=$(ps -eo pid,pcpu,pmem,comm --sort=-pcpu | sed -n '3p' | awk '{print $3}')

envsubst < index.html.template > index.html
