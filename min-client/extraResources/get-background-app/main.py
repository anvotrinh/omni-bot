import time
import random
import sys

names = ["Google Chrome", "Microsoft Word", "Visual Studio Code", "Other"]

def print_random_name(interval):
    while True:
        print(random.choice(names), flush=True)
        time.sleep(interval)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python script_name.py <interval>", flush=True)
        sys.exit(1)
    try:
        interval_argument = int(sys.argv[1])
        print_random_name(interval_argument)
    except ValueError:
        print("Specify an integer value for the interval argument.", flush=True)
        sys.exit(1)