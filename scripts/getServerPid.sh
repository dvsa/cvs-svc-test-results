lsof -i:3006 | awk '{print $2}' | grep -v '^PID'
