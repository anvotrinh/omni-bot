import subprocess
import time
import json

exe_path = 'Step.exe'

proc = subprocess.Popen(exe_path, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)

try:
    while True:
        time.sleep(5)
        # Command1
        data1 = {
            "Command_ID": 1,
            "Command_Parameter": ""
        }
        json_str1 = json.dumps(data1) + '\n'
        print('Sending to C# app: 1')
        proc.stdin.write(json_str1)
        proc.stdin.flush()
        
        output1 = proc.stdout.readline()
        if output1:
            print("Received output for Command1:", output1.strip())
        
        print("-------5 sec sleep-------------")
        time.sleep(1)
        # Command2
        data2 = {
            "Command_ID": 2,
            "Command_Parameter": "Hello world"
        }
        json_str2 = json.dumps(data2) + '\n'
        print('Sending to C# app: 2, Hello world')
        proc.stdin.write(json_str2)
        proc.stdin.flush()
        
        output2 = proc.stdout.readline()
        if output2:
            print("Received output for Command2:", output2.strip())
        
        print("--------------------")
        print("-------10 sec sleep-------------")
        print("--------------------")
        time.sleep(10)

except KeyboardInterrupt:
    print("Terminating...")
    proc.stdin.close()
    proc.wait()
#{"Command_ID": 1, "Command_Parameter": ""}
#{"Command_ID": 2, "Command_Parameter": "Hello World"}
#{"Command_ID": 0, "Command_Parameter": ""}
#Command 2 Executed.