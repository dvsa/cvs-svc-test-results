!/bin/sh

lsof -i:8004 | awk '{print $2}' | tail -1
