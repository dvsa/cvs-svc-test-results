lsof -i:8014 | awk '{print $2}' | grep -v '^PID'
