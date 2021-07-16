lsof -i:8004 | awk '{print $2}' | grep -v '^PID'
