#!/usr/bin/env python3
"""Seeds an AWS account with the Rolevara Pacific Crest Logistics ticket scenario.

Run in AWS CloudShell, in the folder that holds rolevara-lab-aws.json:

    python3 seed_rolevara_lab.py --dry-run    # checks the account and shows the plan; changes nothing
    python3 seed_rolevara_lab.py

Creates the CloudFormation stack "rolevara-lab": 7 IAM users and 9 IAM groups under the path
/rolevara-lab/, with no permissions attached to any of them, so the lab users can't do anything in
the account. Users are tagged rolevara-lab=pacific-crest. One leaver gets an access key, so
offboarding has a key to deactivate; its secret is never shown or saved. Users that start with
console access get one long random password that is never shown or saved; nobody signs in as them.

Run this only in a free-tier account you made for practice, never in an employer's account. The
script stops if the account has more than 50 IAM users (unless you pass --lab-account) and asks you
to type the account ID before changing anything. It uses CloudShell's own credentials: no access
keys are created for you or stored. IAM, CloudFormation and CloudShell have no charge.
"""
import argparse
import json
import os
import secrets
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "rolevara-lab-aws.json")
STACK = "rolevara-lab"
LAB_PATH = "/rolevara-lab/"


class AwsError(Exception):
    pass


def aws(*args):
    """Runs an AWS CLI command and returns its JSON output. Raises AwsError with the CLI's message."""
    r = subprocess.run(["aws", *args, "--output", "json"], capture_output=True, text=True)
    if r.returncode != 0:
        raise AwsError(r.stderr.strip() or f"aws {' '.join(args[:2])} failed")
    return json.loads(r.stdout) if r.stdout.strip() else {}


def exists(*args):
    try:
        aws(*args)
        return True
    except AwsError as e:
        if "NoSuchEntity" in str(e) or "does not exist" in str(e):
            return False
        raise


def main():
    ap = argparse.ArgumentParser(description="Seed the Rolevara AWS lab.")
    ap.add_argument("--dry-run", action="store_true", help="check the account and show the plan without changing anything")
    ap.add_argument("--lab-account", action="store_true", help="allow an account with more than 50 IAM users (only if it really is a lab)")
    a = ap.parse_args()

    if not os.path.exists(TEMPLATE):
        sys.exit("rolevara-lab-aws.json isn't in this folder. Upload it to CloudShell next to this script.")
    with open(TEMPLATE) as f:
        tpl = json.load(f)
    res = tpl["Resources"].values()
    users = [r["Properties"]["UserName"] for r in res if r["Type"] == "AWS::IAM::User"]
    groups = [r["Properties"]["GroupName"] for r in res if r["Type"] == "AWS::IAM::Group"]

    who = aws("sts", "get-caller-identity")
    account = who["Account"]
    alias = (aws("iam", "list-account-aliases").get("AccountAliases") or ["(no alias)"])[0]
    count = len(aws("iam", "list-users").get("Users", []))

    print()
    print(f"Account:  {account} {alias}")
    print(f"Signed in as: {who['Arn']}")
    print(f"IAM users: {count}")
    print(f"Creates:  stack '{STACK}' with {len(users)} IAM users and {len(groups)} IAM groups under {LAB_PATH}, no permissions attached.")
    print()
    if count > 50 and not a.lab_account:
        sys.exit(f"This account has {count} IAM users, which looks like a real organization. Rolevara seeds lab accounts only. "
                 "If this really is a lab account, run the script again with --lab-account.")

    # Stop before changing anything if the stack or a name already exists.
    if exists("cloudformation", "describe-stacks", "--stack-name", STACK):
        sys.exit(f"A stack named {STACK} already exists. Run remove_rolevara_lab.py first, then seed again.")
    for g in groups:
        if exists("iam", "get-group", "--group-name", g):
            sys.exit(f"An IAM group named {g} already exists in this account. Nothing was changed.")
    for u in users:
        if exists("iam", "get-user", "--user-name", u):
            sys.exit(f"An IAM user named {u} already exists in this account. Nothing was changed.")

    aws("cloudformation", "validate-template", "--template-body", f"file://{TEMPLATE}")
    if a.dry_run:
        for g in groups:
            print(f"  would create group  {LAB_PATH}{g}")
        for r in res:
            if r["Type"] == "AWS::IAM::User":
                p = r["Properties"]
                tags = {t["Key"]: t["Value"] for t in p["Tags"]}
                console = "console access" if "LoginProfile" in p else "no console access"
                print(f"  would create user   {LAB_PATH}{p['UserName']} ({tags['JobTitle']}, {console}, {len(p['Groups'])} groups)")
        print("\nDry run: nothing was changed.")
        return

    typed = input(f"Type the account ID {account} to seed this account: ").strip()
    if typed != account:
        sys.exit("The account ID didn't match. Nothing was changed.")

    # The password goes to CloudFormation in a private temporary file, not on the command line.
    password = secrets.token_urlsafe(24) + "-Aa1!"
    fd, params = tempfile.mkstemp(suffix=".json")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump([{"ParameterKey": "LabPassword", "ParameterValue": password}], f)
        aws("cloudformation", "create-stack", "--stack-name", STACK, "--template-body", f"file://{TEMPLATE}",
            "--parameters", f"file://{params}", "--capabilities", "CAPABILITY_NAMED_IAM",
            "--tags", "Key=rolevara-lab,Value=pacific-crest")
    finally:
        os.remove(params)
    print("Creating the stack. This usually takes a minute or two...")
    try:
        aws("cloudformation", "wait", "stack-create-complete", "--stack-name", STACK)
    except AwsError:
        events = aws("cloudformation", "describe-stack-events", "--stack-name", STACK).get("StackEvents", [])
        for e in events:
            if e["ResourceStatus"].endswith("FAILED"):
                print(f"  {e['LogicalResourceId']}: {e.get('ResourceStatusReason', '')}")
        sys.exit("The stack didn't finish. Run remove_rolevara_lab.py to clean up, then seed again.")

    print("\nSeeded. Next: work the six tickets in the IAM console, then run: python3 check_rolevara_lab.py")


if __name__ == "__main__":
    try:
        main()
    except AwsError as e:
        sys.exit(f"AWS CLI error: {e}")
    except KeyboardInterrupt:
        sys.exit("\nStopped.")
