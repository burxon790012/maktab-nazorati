#!/bin/bash
echo "=== Samsung Galaxy Watch5 Pro ADB Ulanish (Kali Linux) ==="
read -p "Soat IP manzili (masalan: 192.168.1.15): " WATCH_IP
read -p "Pairing Port (Pair new device oynasidagi 5 xonali port): " PAIR_PORT
read -p "6 xonali Wi-Fi Pairing Code: " PAIR_CODE
adb pair $WATCH_IP:$PAIR_PORT $PAIR_CODE
read -p "Asosiy Wireless port: " MAIN_PORT
adb connect $WATCH_IP:$MAIN_PORT
adb devices
